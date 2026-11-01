import { supabase } from '@/lib/supabase';
import type { BookingDetails, Movie, Showtime } from '@/types/cinema';

export async function fetchMovies(): Promise<Movie[]> {
  const { data, error } = await supabase
    .from('movies')
    .select('id, title, synopsis, genre, duration_minutes, rating, poster_url, backdrop_url')
    .order('title');
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function fetchUpcomingShowtimes(movieId: string): Promise<Showtime[]> {
  const { data, error } = await supabase
    .from('showtimes')
    .select('id, movie_id, starts_at, hall, price_cents')
    .eq('movie_id', movieId)
    .gte('starts_at', new Date().toISOString())
    .order('starts_at');
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function fetchTakenSeats(showtimeId: string): Promise<string[]> {
  const { data, error } = await supabase.rpc('get_taken_seats', { p_showtime_id: showtimeId });
  if (error) throw new Error(error.message);
  return Array.isArray(data) ? data : [];
}

interface CreateBookingInput {
  showtimeId: string;
  seats: string[];
  customerName: string;
  customerEmail: string;
}

export async function createBooking({
  showtimeId,
  seats,
  customerName,
  customerEmail,
}: CreateBookingInput): Promise<string> {
  const { data, error } = await supabase.rpc('create_booking', {
    p_showtime_id: showtimeId,
    p_seats: seats,
    p_customer_name: customerName,
    p_customer_email: customerEmail,
  });
  if (error) throw new Error(error.message);
  if (typeof data !== 'string') throw new Error('Your booking could not be confirmed. Please try again.');
  return data;
}

export async function fetchBookingByCode(code: string): Promise<BookingDetails | null> {
  const { data, error } = await supabase.rpc('get_booking', { p_confirmation_code: code });
  if (error) throw new Error(error.message);
  if (!Array.isArray(data) || data.length === 0) return null;
  return data[0] as BookingDetails;
}
