import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { createBooking, fetchTakenSeats } from '@/lib/cinema-api';
import { formatShowtimeLabel } from '@/lib/format';
import type { Movie, Showtime } from '@/types/cinema';
import SeatCheckoutPanel from '@/components/SeatCheckoutPanel';

interface SeatPickerProps {
  movie: Movie;
  showtime: Showtime;
  onBack: () => void;
  onBooked: (code: string) => void;
}

const ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const SEATS_PER_ROW = 12;
const AISLE_AFTER = 6;
const MAX_SEATS = 8;

const SEAT_ORDER = ROWS.flatMap((row) =>
  Array.from({ length: SEATS_PER_ROW }, (_, index) => `${row}${index + 1}`)
);

export default function SeatPicker({ movie, showtime, onBack, onBooked }: SeatPickerProps) {
  const [takenSeats, setTakenSeats] = useState<string[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [selectionError, setSelectionError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchTakenSeats(showtime.id)
      .then((seats) => {
        if (!active) return;
        setTakenSeats(seats);
        setStatus('ready');
      })
      .catch(() => {
        if (active) setStatus('error');
      });
    return () => {
      active = false;
    };
  }, [showtime.id]);

  const sortedSelection = SEAT_ORDER.filter((seat) => selectedSeats.includes(seat));

  function toggleSeat(seat: string) {
    setSelectionError(null);
    setFormError(null);
    if (selectedSeats.includes(seat)) {
      setSelectedSeats(selectedSeats.filter((item) => item !== seat));
      return;
    }
    if (selectedSeats.length >= MAX_SEATS) {
      setSelectionError(`You can book up to ${MAX_SEATS} seats at once.`);
      return;
    }
    setSelectedSeats([...selectedSeats, seat]);
  }

  async function refreshTakenSeats() {
    try {
      const seats = await fetchTakenSeats(showtime.id);
      setTakenSeats(seats);
      setSelectedSeats((current) => current.filter((seat) => !seats.includes(seat)));
    } catch {
      setStatus('error');
    }
  }

  async function handleCheckout({ name, email }: { name: string; email: string }) {
    setSubmitting(true);
    setFormError(null);
    try {
      const code = await createBooking({
        showtimeId: showtime.id,
        seats: sortedSelection,
        customerName: name,
        customerEmail: email,
      });
      onBooked(code);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      await refreshTakenSeats();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 animate-fade-in">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-medium text-neutral-400 transition-colors hover:text-amber-300"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to showtimes
      </button>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-50">Select your seats</h1>
          <p className="mt-2 text-neutral-400">
            {movie.title} · {formatShowtimeLabel(showtime.starts_at)} · {showtime.hall}
          </p>

          <div className="mt-8 rounded-2xl border border-white/10 bg-neutral-900/60 p-4 sm:p-8">
            <div className="mx-auto mb-10 h-2 w-3/4 rounded-full bg-gradient-to-r from-transparent via-amber-300/80 to-transparent" />
            <p className="mb-8 text-center text-xs uppercase tracking-[0.3em] text-neutral-500">Screen</p>

            {status === 'loading' && <p className="text-center text-neutral-400">Loading seat map...</p>}

            {status === 'error' && (
              <p className="text-center text-red-300">
                We couldn't load the seat map. Please go back and choose the showtime again.
              </p>
            )}

            {status === 'ready' && (
              <div className="flex flex-col items-center gap-2 overflow-x-auto pb-2">
                {ROWS.map((row) => (
                  <div key={row} className="flex items-center gap-1.5 sm:gap-2">
                    <span className="w-5 text-center text-xs font-semibold text-neutral-500">{row}</span>
                    {Array.from({ length: SEATS_PER_ROW }, (_, index) => {
                      const seat = `${row}${index + 1}`;
                      const isTaken = takenSeats.includes(seat);
                      const isSelected = selectedSeats.includes(seat);
                      return (
                        <span key={seat} className="flex items-center gap-1.5 sm:gap-2">
                          <button
                            type="button"
                            disabled={isTaken}
                            aria-pressed={isSelected}
                            aria-label={`Seat ${seat}${isTaken ? ', taken' : ''}`}
                            onClick={() => toggleSeat(seat)}
                            className={[
                              'h-7 w-7 rounded-t-lg text-[10px] font-semibold transition-all duration-150 sm:h-8 sm:w-8 sm:text-xs',
                              isTaken
                                ? 'cursor-not-allowed bg-neutral-700 text-neutral-500 line-through'
                                : isSelected
                                  ? 'scale-110 bg-amber-400 text-neutral-950 shadow-lg shadow-amber-400/30'
                                  : 'bg-neutral-700 text-neutral-200 hover:-translate-y-0.5 hover:bg-neutral-600',
                            ].join(' ')}
                          >
                            {index + 1}
                          </button>
                          {index + 1 === AISLE_AFTER && <span className="w-4 sm:w-8" aria-hidden="true" />}
                        </span>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-8 flex flex-wrap justify-center gap-6 text-xs text-neutral-400">
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-t bg-neutral-700" aria-hidden="true" /> Available
              </span>
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-t bg-amber-400" aria-hidden="true" /> Selected
              </span>
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-t bg-neutral-700 opacity-40" aria-hidden="true" /> Taken
              </span>
            </div>
          </div>

          {selectionError && <p className="mt-4 text-sm text-amber-300">{selectionError}</p>}
        </div>

        <SeatCheckoutPanel
          movieTitle={movie.title}
          showtimeLabel={formatShowtimeLabel(showtime.starts_at)}
          hall={showtime.hall}
          seats={sortedSelection}
          unitPriceCents={showtime.price_cents}
          submitting={submitting}
          error={formError}
          onSubmit={handleCheckout}
        />
      </div>
    </section>
  );
}
