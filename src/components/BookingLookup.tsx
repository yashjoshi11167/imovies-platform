import { useState, type FormEvent } from 'react';
import { ArrowLeft, Loader2, Search } from 'lucide-react';
import { fetchBookingByCode } from '@/lib/cinema-api';
import type { BookingDetails } from '@/types/cinema';
import BookingSummary from '@/components/BookingSummary';

interface BookingLookupProps {
  onBack: () => void;
}

export default function BookingLookup({ onBack }: BookingLookupProps) {
  const [code, setCode] = useState('');
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchBookingByCode(trimmed);
      setBooking(result);
      setSearched(true);
    } catch {
      setBooking(null);
      setError("We couldn't look up that booking. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-12 animate-fade-in">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-medium text-neutral-400 transition-colors hover:text-amber-300"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to films
      </button>

      <h1 className="mt-6 text-3xl font-bold tracking-tight text-neutral-50">Find my booking</h1>
      <p className="mt-2 text-neutral-400">Enter the booking reference from your confirmation.</p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3 sm:flex-row">
        <label className="sr-only" htmlFor="booking-code">
          Booking reference
        </label>
        <input
          id="booking-code"
          type="text"
          value={code}
          maxLength={12}
          onChange={(event) => setCode(event.target.value)}
          placeholder="e.g. 4F9A2C1B"
          className="w-full flex-1 rounded-full border border-white/15 bg-neutral-900 px-5 py-3.5 font-mono text-lg uppercase tracking-widest text-neutral-50 placeholder:normal-case placeholder:tracking-normal placeholder:text-neutral-600 transition focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30"
        />
        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-400 px-6 py-3.5 font-semibold text-neutral-950 transition-all hover:bg-amber-300 active:scale-95 disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:text-neutral-400"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          ) : (
            <Search className="h-5 w-5" aria-hidden="true" />
          )}
          Find booking
        </button>
      </form>

      {error && <p className="mt-4 text-sm text-red-300">{error}</p>}

      {searched && !error && !booking && (
        <p className="mt-8 rounded-2xl border border-white/10 bg-neutral-900 p-6 text-neutral-300">
          No booking matches that reference. Check the code and try again.
        </p>
      )}

      {booking && <div className="mt-8 animate-fade-in"><BookingSummary booking={booking} /></div>}
    </section>
  );
}
