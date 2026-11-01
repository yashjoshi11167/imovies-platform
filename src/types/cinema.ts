export interface Movie {
  id: string;
  title: string;
  synopsis: string;
  genre: string;
  duration_minutes: number;
  rating: string;
  poster_url: string;
  backdrop_url: string;
}

export interface Showtime {
  id: string;
  movie_id: string;
  starts_at: string;
  hall: string;
  price_cents: number;
}

export interface BookingDetails {
  confirmation_code: string;
  customer_name: string;
  seats: string[];
  total_cents: number;
  movie_title: string;
  poster_url: string;
  starts_at: string;
  hall: string;
  created_at: string;
}
