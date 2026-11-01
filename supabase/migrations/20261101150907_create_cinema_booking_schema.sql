/*
# Create cinema booking schema

1. New Tables
- `movies`: film catalogue (title, synopsis, genre, runtime, rating, artwork URLs).
- `showtimes`: scheduled screenings of a movie (start time, hall, ticket price in cents).
- `bookings`: a customer's reservation for one showtime (name, email, seats, total, confirmation code).
- `booked_seats`: one row per reserved seat per showtime. A unique constraint prevents two customers from taking the same seat.

2. Functions (the only way the public app touches bookings)
- `get_taken_seats(showtime_id)`: returns seat codes already reserved for a showtime.
- `create_booking(...)`: validates the request and reserves seats atomically, returns the confirmation code.
- `get_booking(confirmation_code)`: returns one booking with its movie and showtime details.

3. Security
- RLS enabled on every table.
- `movies` and `showtimes` are public read-only for anonymous visitors.
- `bookings` and `booked_seats` have no direct client access; anonymous visitors can only reach them through the functions above, so one customer cannot list other customers' bookings.
- Functions are not callable by the public role; only anon and authenticated may execute them.

4. Seed data
- Six sample films and seven days of showtimes starting today.

# Notes
- Seat codes are rows A to H and seats 1 to 12 (for example "C7").
- Idempotent: safe to re-run.
*/

CREATE TABLE IF NOT EXISTS movies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  synopsis text NOT NULL,
  genre text NOT NULL,
  duration_minutes integer NOT NULL CHECK (duration_minutes > 0),
  rating text NOT NULL,
  poster_url text NOT NULL,
  backdrop_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS showtimes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id uuid NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  starts_at timestamptz NOT NULL,
  hall text NOT NULL,
  price_cents integer NOT NULL CHECK (price_cents >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS showtimes_movie_id_idx ON showtimes (movie_id);
CREATE INDEX IF NOT EXISTS showtimes_starts_at_idx ON showtimes (starts_at);

CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  showtime_id uuid NOT NULL REFERENCES showtimes(id) ON DELETE RESTRICT,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  seat_count integer NOT NULL CHECK (seat_count > 0),
  total_cents integer NOT NULL CHECK (total_cents >= 0),
  confirmation_code text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS booked_seats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  showtime_id uuid NOT NULL REFERENCES showtimes(id) ON DELETE RESTRICT,
  seat text NOT NULL,
  CONSTRAINT booked_seats_unique_seat UNIQUE (showtime_id, seat)
);

CREATE INDEX IF NOT EXISTS booked_seats_booking_id_idx ON booked_seats (booking_id);

ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE showtimes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booked_seats ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON movies TO anon, authenticated;
GRANT SELECT ON showtimes TO anon, authenticated;

DROP POLICY IF EXISTS "public_read_movies" ON movies;
CREATE POLICY "public_read_movies" ON movies FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_read_showtimes" ON showtimes;
CREATE POLICY "public_read_showtimes" ON showtimes FOR SELECT
  TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION get_taken_seats(p_showtime_id uuid)
RETURNS SETOF text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT seat FROM booked_seats WHERE showtime_id = p_showtime_id ORDER BY seat;
$$;

CREATE OR REPLACE FUNCTION create_booking(
  p_showtime_id uuid,
  p_seats text[],
  p_customer_name text,
  p_customer_email text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_price integer;
  v_code text;
  v_booking_id uuid;
  v_seat text;
BEGIN
  IF p_showtime_id IS NULL OR p_seats IS NULL OR array_length(p_seats, 1) IS NULL THEN
    RAISE EXCEPTION 'Please choose at least one seat.';
  END IF;

  IF array_length(p_seats, 1) > 8 THEN
    RAISE EXCEPTION 'You can book up to 8 seats at once.';
  END IF;

  IF length(trim(coalesce(p_customer_name, ''))) < 2 THEN
    RAISE EXCEPTION 'Please enter your name.';
  END IF;

  IF p_customer_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RAISE EXCEPTION 'Please enter a valid email address.';
  END IF;

  FOREACH v_seat IN ARRAY p_seats LOOP
    IF v_seat !~ '^[A-H]([1-9]|1[0-2])$' THEN
      RAISE EXCEPTION 'Seat % does not exist.', v_seat;
    END IF;
  END LOOP;

  IF (SELECT count(DISTINCT s) FROM unnest(p_seats) AS s) <> array_length(p_seats, 1) THEN
    RAISE EXCEPTION 'Each seat can only be selected once.';
  END IF;

  SELECT price_cents INTO v_price FROM showtimes WHERE id = p_showtime_id;
  IF v_price IS NULL THEN
    RAISE EXCEPTION 'This showtime is no longer available.';
  END IF;

  v_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));

  INSERT INTO bookings (showtime_id, customer_name, customer_email, seat_count, total_cents, confirmation_code)
  VALUES (
    p_showtime_id,
    trim(p_customer_name),
    lower(trim(p_customer_email)),
    array_length(p_seats, 1),
    v_price * array_length(p_seats, 1),
    v_code
  )
  RETURNING id INTO v_booking_id;

  BEGIN
    INSERT INTO booked_seats (booking_id, showtime_id, seat)
    SELECT v_booking_id, p_showtime_id, s FROM unnest(p_seats) AS s;
  EXCEPTION WHEN unique_violation THEN
    RAISE EXCEPTION 'Sorry, one or more of those seats was just taken. Please choose again.';
  END;

  RETURN v_code;
END;
$$;

CREATE OR REPLACE FUNCTION get_booking(p_confirmation_code text)
RETURNS TABLE (
  confirmation_code text,
  customer_name text,
  seats text[],
  total_cents integer,
  movie_title text,
  poster_url text,
  starts_at timestamptz,
  hall text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    b.confirmation_code,
    b.customer_name,
    ARRAY(SELECT bs.seat FROM booked_seats bs WHERE bs.booking_id = b.id ORDER BY bs.seat),
    b.total_cents,
    m.title,
    m.poster_url,
    s.starts_at,
    s.hall,
    b.created_at
  FROM bookings b
  JOIN showtimes s ON s.id = b.showtime_id
  JOIN movies m ON m.id = s.movie_id
  WHERE b.confirmation_code = upper(trim(p_confirmation_code));
$$;

REVOKE EXECUTE ON FUNCTION get_taken_seats(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION create_booking(uuid, text[], text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION get_booking(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION get_taken_seats(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION create_booking(uuid, text[], text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_booking(text) TO anon, authenticated;

INSERT INTO movies (title, synopsis, genre, duration_minutes, rating, poster_url, backdrop_url)
SELECT * FROM (VALUES
  ('Neon Harbor', 'A night courier discovers a map hidden inside a stolen transistor radio and is pulled into a race across a flooded city.', 'Thriller', 118, 'PG-13', 'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg', 'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg'),
  ('The Quiet Orchard', 'When an aging beekeeper inherits her late brother''s farm, she uncovers letters that rewrite the story of her family.', 'Drama', 104, 'PG', 'https://images.pexels.com/photos/1267338/pexels-photo-1267338.jpeg', 'https://images.pexels.com/photos/1267338/pexels-photo-1267338.jpeg'),
  ('Orbit Nine', 'A crew of three maintenance engineers must repair a failing relay station before the next solar storm hits.', 'Sci-Fi', 132, 'PG-13', 'https://images.pexels.com/photos/2150/sky-space-dark-galaxy.jpg', 'https://images.pexels.com/photos/2150/sky-space-dark-galaxy.jpg'),
  ('Paper Lanterns', 'Two rival bakers in a seaside town are forced to share a kitchen during the festival season.', 'Comedy', 97, 'PG', 'https://images.pexels.com/photos/2290337/pexels-photo-2290337.jpeg', 'https://images.pexels.com/photos/2290337/pexels-photo-2290337.jpeg'),
  ('Ironwood Trail', 'A retired ranger leads a reluctant teenager on a final trek through a forest that no longer appears on any map.', 'Adventure', 126, 'PG', 'https://images.pexels.com/photos/338936/pexels-photo-338936.jpeg', 'https://images.pexels.com/photos/338936/pexels-photo-338936.jpeg'),
  ('Midnight Overture', 'A disgraced composer takes one last commission for an opera house that burned down forty years ago.', 'Mystery', 111, 'R', 'https://images.pexels.com/photos/167636/pexels-photo-167636.jpeg', 'https://images.pexels.com/photos/167636/pexels-photo-167636.jpeg')
) AS v(title, synopsis, genre, duration_minutes, rating, poster_url, backdrop_url)
WHERE NOT EXISTS (SELECT 1 FROM movies);

INSERT INTO showtimes (movie_id, starts_at, hall, price_cents)
SELECT
  m.id,
  (current_date + d.day_offset + t.show_time) AT TIME ZONE 'UTC',
  CASE WHEN (row_number() OVER (ORDER BY m.title, d.day_offset, t.show_time)) % 2 = 0 THEN 'Hall 1' ELSE 'Hall 2' END,
  1200 + (t.show_time_index * 200)
FROM movies m
CROSS JOIN generate_series(0, 6) AS d(day_offset)
CROSS JOIN (VALUES (0, time '14:00'), (1, time '18:30'), (2, time '21:30')) AS t(show_time_index, show_time)
WHERE NOT EXISTS (SELECT 1 FROM showtimes);
