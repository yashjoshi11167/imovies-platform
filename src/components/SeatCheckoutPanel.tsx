import { useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { formatPrice } from '@/lib/format';

interface SeatCheckoutPanelProps {
  movieTitle: string;
  showtimeLabel: string;
  hall: string;
  seats: string[];
  unitPriceCents: number;
  submitting: boolean;
  error: string | null;
  onSubmit: (details: { name: string; email: string }) => void;
}

const inputClass =
  'mt-2 w-full rounded-xl border border-white/15 bg-neutral-950 px-4 py-3 text-neutral-50 placeholder:text-neutral-600 transition focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30';

export default function SeatCheckoutPanel({
  movieTitle,
  showtimeLabel,
  hall,
  seats,
  unitPriceCents,
  submitting,
  error,
  onSubmit,
}: SeatCheckoutPanelProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const totalCents = unitPriceCents * seats.length;
  const canSubmit = seats.length > 0 && !submitting;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    onSubmit({ name: name.trim(), email: email.trim() });
  }

  return (
    <aside className="h-fit rounded-2xl border border-white/10 bg-neutral-900 p-6 lg:sticky lg:top-24">
      <h2 className="text-lg font-semibold text-neutral-50">Your order</h2>
      <dl className="mt-4 space-y-3 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-neutral-400">Film</dt>
          <dd className="text-right font-medium text-neutral-100">{movieTitle}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-neutral-400">Showtime</dt>
          <dd className="text-right font-medium text-neutral-100">{showtimeLabel}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-neutral-400">Hall</dt>
          <dd className="text-right font-medium text-neutral-100">{hall}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-neutral-400">Seats</dt>
          <dd className="text-right font-medium text-neutral-100">
            {seats.length > 0 ? seats.join(', ') : 'None selected'}
          </dd>
        </div>
      </dl>

      <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-5">
        <span className="text-neutral-400">Total</span>
        <span className="text-2xl font-bold text-amber-300">{formatPrice(totalCents)}</span>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block text-sm font-medium text-neutral-300">
          Full name
          <input
            type="text"
            required
            minLength={2}
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={inputClass}
            placeholder="Alex Morgan"
          />
        </label>
        <label className="block text-sm font-medium text-neutral-300">
          Email for confirmation
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={inputClass}
            placeholder="you@example.com"
          />
        </label>

        {error && (
          <p role="alert" className="rounded-xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-amber-400 px-6 py-3.5 text-base font-semibold text-neutral-950 transition-all hover:bg-amber-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:text-neutral-400"
        >
          {submitting && <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />}
          {submitting ? 'Booking your seats...' : seats.length > 0 ? 'Confirm booking' : 'Select seats to continue'}
        </button>
      </form>
    </aside>
  );
}
