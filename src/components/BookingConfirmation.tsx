import { useEffect, useState } from 'react';
import { CheckCircle2, Film } from 'lucide-react';
import { fetchBookingByCode } from '@/lib/cinema-api';
import type { BookingDetails } from '@/types/cinema';
import BookingSummary from '@/components/BookingSummary';

interface BookingConfirmationProps {
  code: string;
  onBrowseFilms: () => void;
}

export default function BookingConfirmation({ code, onBrowseFilms }: BookingConfirmationProps) {
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading');

  useEffect(() => {
    let active = true;
    fetchBookingByCode(code)
      .then((data) => {
        if (!active) return;
        setBooking(data);
        setStatus(data ? 'ready' : 'missing');
      })
      .catch(() => {
        if (active) setStatus('error');
      });
    return () => {
      active = false;
    };
  }, [code]);

  return (
    <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 animate-fade-in">
      <div className="text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-400/40">
          <CheckCircle2 className="h-9 w-9 text-emerald-300" aria-hidden="true" />
        </span>
        <h1 className="mt-6 text-3xl font-bold tracking-tight text-neutral-50 sm:text-4xl">You're booked</h1>
        <p className="mt-3 text-neutral-400">Show this reference at the cinema to collect your tickets.</p>
      </div>

      <div className="mt-10">
        {status === 'loading' && <p className="text-center text-neutral-400">Loading your booking...</p>}
        {status === 'error' && (
          <p className="text-center text-red-300">
            We couldn't load your booking details. Use "Find my booking" with reference {code} to try again.
          </p>
        )}
        {status === 'missing' && (
          <p className="text-center text-neutral-400">We couldn't find a booking with reference {code}.</p>
        )}
        {status === 'ready' && booking && <BookingSummary booking={booking} />}
      </div>

      <div className="mt-10 text-center">
        <button
          type="button"
          onClick={onBrowseFilms}
          className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-neutral-100 transition-all hover:border-amber-400 hover:text-amber-300 active:scale-95"
        >
          <Film className="h-4 w-4" aria-hidden="true" />
          Browse more films
        </button>
      </div>
    </section>
  );
}
