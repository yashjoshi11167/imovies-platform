import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import MovieList from '@/components/MovieList';
import MovieDetail from '@/components/MovieDetail';
import SeatPicker from '@/components/SeatPicker';
import BookingConfirmation from '@/components/BookingConfirmation';
import BookingLookup from '@/components/BookingLookup';
import type { Movie, Showtime } from '@/types/cinema';

type View =
  | { name: 'home' }
  | { name: 'movie'; movie: Movie }
  | { name: 'seats'; movie: Movie; showtime: Showtime }
  | { name: 'confirmed'; code: string }
  | { name: 'lookup' };

function App() {
  const [view, setView] = useState<View>({ name: 'home' });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [view.name]);

  function renderView() {
    switch (view.name) {
      case 'home':
        return <MovieList onSelectMovie={(movie) => setView({ name: 'movie', movie })} />;
      case 'movie':
        return (
          <MovieDetail
            movie={view.movie}
            onBack={() => setView({ name: 'home' })}
            onSelectShowtime={(showtime) => setView({ name: 'seats', movie: view.movie, showtime })}
          />
        );
      case 'seats':
        return (
          <SeatPicker
            movie={view.movie}
            showtime={view.showtime}
            onBack={() => setView({ name: 'movie', movie: view.movie })}
            onBooked={(code) => setView({ name: 'confirmed', code })}
          />
        );
      case 'confirmed':
        return (
          <BookingConfirmation code={view.code} onBrowseFilms={() => setView({ name: 'home' })} />
        );
      case 'lookup':
        return <BookingLookup onBack={() => setView({ name: 'home' })} />;
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 antialiased">
      <Header
        onHome={() => setView({ name: 'home' })}
        onFindBooking={() => setView({ name: 'lookup' })}
      />
      <main>{renderView()}</main>
      <footer className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-8 text-center text-sm text-neutral-500 sm:px-6">
          Reelhouse Cinemas. Tickets are collected at the cinema with your booking reference.
        </div>
      </footer>
    </div>
  );
}

export default App;
