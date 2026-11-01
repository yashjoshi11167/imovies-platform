import { Clapperboard, Ticket } from 'lucide-react';

interface HeaderProps {
  onHome: () => void;
  onFindBooking: () => void;
}

export default function Header({ onHome, onFindBooking }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-neutral-950/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <button
          type="button"
          onClick={onHome}
          className="flex items-center gap-2 text-neutral-50 transition-colors hover:text-amber-300"
        >
          <Clapperboard className="h-6 w-6 text-amber-400" aria-hidden="true" />
          <span className="text-lg font-bold tracking-tight">Reelhouse</span>
        </button>
        <button
          type="button"
          onClick={onFindBooking}
          className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-neutral-100 transition-all hover:border-amber-400 hover:text-amber-300 active:scale-95"
        >
          <Ticket className="h-4 w-4" aria-hidden="true" />
          Find my booking
        </button>
      </div>
    </header>
  );
}
