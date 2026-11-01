import { useEffect, useState } from 'react';
import { ArrowLeft, Clock } from 'lucide-react';
import { fetchUpcomingShowtimes } from '@/lib/cinema-api';
import { formatPrice, formatRuntime, formatTime, groupShowtimesByDay } from '@/lib/format';
import type { Movie, Showtime } from '@/types/cinema';

interface MovieDetailProps {
  movie: Movie;
  onBack: () => void;
  onSelectShowtime: (showtime: Showtime) => void;
}

export default function MovieDetail({ movie, onBack, onSelectShowtime }: MovieDetailProps) {
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let active = true;
    setStatus('loading');
    fetchUpcomingShowtimes(movie.id)
      .then((data) => {
        if (!active) return;
        setShowtimes(data);
        setStatus('ready');
      })
      .catch(() => {
        if (active) setStatus('error');
      });
    return () => {
      active = false;
    };
  }, [movie.id]);

  const dayGroups = groupShowtimesByDay(showtimes);

  return (
    <article className="animate-fade-in">
      <div className="relative h-72 overflow-hidden sm:h-96">
        <img src={movie.backdrop_url} alt="" aria-hidden="true" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/50 to-neutral-950/20" />
        <button
          type="button"
          onClick={onBack}
          className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-sm font-medium text-neutral-100 backdrop-blur transition-colors hover:bg-black/80 sm:left-6"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          All films
        </button>
      </div>

      <div className="mx-auto -mt-40 grid max-w-6xl gap-8 px-4 sm:-mt-48 sm:px-6 md:grid-cols-[220px_1fr]">
        <img
          src={movie.poster_url}
          alt={`Poster for ${movie.title}`}
          className="mx-auto w-44 rounded-2xl object-cover shadow-2xl shadow-black/60 ring-1 ring-white/10 md:mx-0 md:w-full"
        />

        <div className="pb-16 pt-2 md:pt-24">
          <p className="text-sm font-semibold uppercase tracking-widest text-amber-400">{movie.genre}</p>
          <h1 className="mt-2 text-3xl font-bold leading-tight tracking-tight text-neutral-50 sm:text-4xl">
            {movie.title}
          </h1>
          <p className="mt-3 flex items-center gap-2 text-sm text-neutral-400">
            <Clock className="h-4 w-4" aria-hidden="true" />
            {formatRuntime(movie.duration_minutes)} · Rated {movie.rating}
          </p>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-neutral-300">{movie.synopsis}</p>

          <div className="mt-10">
            <h2 className="text-xl font-semibold text-neutral-50">Choose a showtime</h2>

            {status === 'loading' && <p className="mt-4 text-neutral-400">Loading showtimes...</p>}

            {status === 'error' && (
              <p className="mt-4 text-red-300">We couldn't load showtimes. Please go back and try again.</p>
            )}

            {status === 'ready' && dayGroups.length === 0 && (
              <p className="mt-4 text-neutral-400">No upcoming showtimes for this film yet.</p>
            )}

            {status === 'ready' && dayGroups.length > 0 && (
              <div className="mt-6 space-y-8">
                {dayGroups.map((day) => (
                  <div key={day.key}>
                    <h3 className="text-sm font-semibold text-neutral-300">{day.label}</h3>
                    <div className="mt-3 flex flex-wrap gap-3">
                      {day.items.map((showtime) => (
                        <button
                          key={showtime.id}
                          type="button"
                          onClick={() => onSelectShowtime(showtime)}
                          className="group rounded-xl border border-white/15 bg-neutral-900 px-4 py-3 text-left transition-all hover:-translate-y-0.5 hover:border-amber-400 hover:bg-amber-400/10 active:scale-95"
                        >
                          <span className="block text-base font-semibold text-neutral-50 group-hover:text-amber-300">
                            {formatTime(showtime.starts_at)}
                          </span>
                          <span className="mt-1 block text-xs text-neutral-400">
                            {showtime.hall} · {formatPrice(showtime.price_cents)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
