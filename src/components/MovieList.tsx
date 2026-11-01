import { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { fetchMovies } from '@/lib/cinema-api';
import type { Movie } from '@/types/cinema';
import MovieCard from '@/components/MovieCard';

interface MovieListProps {
  onSelectMovie: (movie: Movie) => void;
}

export default function MovieList({ onSelectMovie }: MovieListProps) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  const loadMovies = useCallback(async () => {
    setStatus('loading');
    try {
      setMovies(await fetchMovies());
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    loadMovies();
  }, [loadMovies]);

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-amber-400">Now showing</p>
        <h1 className="mt-3 text-4xl font-bold leading-tight tracking-tight text-neutral-50 sm:text-5xl">
          Pick a film, pick your seat.
        </h1>
        <p className="mt-4 text-base leading-relaxed text-neutral-400">
          Browse this week's screenings and reserve seats in seconds.
        </p>
      </div>

      {status === 'loading' && (
        <div className="mt-12 grid grid-cols-2 gap-6 lg:grid-cols-3 xl:grid-cols-4" aria-busy="true">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="aspect-[2/3] rounded-2xl bg-neutral-800" />
              <div className="mt-4 h-5 w-3/4 rounded bg-neutral-800" />
              <div className="mt-2 h-4 w-1/2 rounded bg-neutral-800" />
            </div>
          ))}
        </div>
      )}

      {status === 'error' && (
        <div className="mt-12 rounded-2xl border border-red-500/30 bg-red-950/40 p-6 text-center">
          <p className="text-neutral-100">We couldn't load the films right now.</p>
          <button
            type="button"
            onClick={loadMovies}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-neutral-100 px-5 py-2.5 text-sm font-semibold text-neutral-950 transition-transform hover:scale-105 active:scale-95"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Try again
          </button>
        </div>
      )}

      {status === 'ready' && movies.length === 0 && (
        <p className="mt-12 text-neutral-400">No films are showing right now. Check back soon.</p>
      )}

      {status === 'ready' && movies.length > 0 && (
        <div className="mt-12 grid grid-cols-2 gap-6 animate-fade-in lg:grid-cols-3 xl:grid-cols-4">
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} onSelect={onSelectMovie} />
          ))}
        </div>
      )}
    </section>
  );
}
