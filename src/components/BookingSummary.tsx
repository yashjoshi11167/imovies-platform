import { formatPrice, formatShowtimeLabel } from '@/lib/format';
import type { BookingDetails } from '@/types/cinema';

interface BookingSummaryProps {
  booking: BookingDetails;
}

export default function BookingSummary({ booking }: BookingSummaryProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-neutral-900">
      <div className="flex flex-col gap-6 p-6 sm:flex-row sm:p-8">
        <img
          src={booking.poster_url}
          alt={`Poster for ${booking.movie_title}`}
          className="mx-auto h-48 w-32 flex-shrink-0 rounded-xl object-cover ring-1 ring-white/10 sm:mx-0"
        />
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">Booking reference</p>
          <p className="mt-1 font-mono text-3xl font-bold tracking-[0.2em] text-neutral-50">
            {booking.confirmation_code}
          </p>
          <h2 className="mt-6 text-xl font-semibold text-neutral-50">{booking.movie_title}</h2>
          <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-neutral-400">Showtime</dt>
              <dd className="mt-1 font-medium text-neutral-100">{formatShowtimeLabel(booking.starts_at)}</dd>
            </div>
            <div>
              <dt className="text-neutral-400">Hall</dt>
              <dd className="mt-1 font-medium text-neutral-100">{booking.hall}</dd>
            </div>
            <div>
              <dt className="text-neutral-400">Seats</dt>
              <dd className="mt-1 font-medium text-neutral-100">{booking.seats.join(', ')}</dd>
            </div>
            <div>
              <dt className="text-neutral-400">Name</dt>
              <dd className="mt-1 font-medium text-neutral-100">{booking.customer_name}</dd>
            </div>
          </dl>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-white/10 bg-neutral-950/60 px-6 py-4 sm:px-8">
        <span className="text-sm text-neutral-400">Total paid at the cinema</span>
        <span className="text-lg font-bold text-amber-300">{formatPrice(booking.total_cents)}</span>
      </div>
    </div>
  );
}
