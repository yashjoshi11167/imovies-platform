import type { Movie } from '@/types/cinema';
import { formatRuntime } from '@/lib/format';

interface MovieCardProps {
  movie: Movie;
  onSelect: (movie: Movie) => void;
}

export default function MovieCard({ movie, onSelect }: MovieCardProps) {
  return (
    <button type="button" onClick={() => onSelect(movie)} className="group block w-full text-left">
      <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-neutral-800 ring-1 ring-white/10 transition duration-300 group-hover:-translate-y-1 group-hover:shadow-2xl group-hover:shadow-black/60 group-hover:ring-amber-400/60">
        <img
          src={movie.poster_url}
          alt={`Poster for ${movie.title}`}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 rounded-full bg-black/75 px-2.5 py-1 text-xs font-semibold text-neutral-50">
          {movie.rating}
        </span>
      </div>
      <span className="mt-4 block text-lg font-semibold text-neutral-50 transition-colors group-hover:text-amber-300">
        {movie.title}
      </span>
      <span className="mt-1 block text-sm text-neutral-400">
        {movie.genre} · {formatRuntime(movie.duration_minutes)}
      </span>
    </button>
  );
}
