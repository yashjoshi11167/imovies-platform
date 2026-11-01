import type { Showtime } from '@/types/cinema';

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

export function formatRuntime(minutes: number): string {
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

export function formatShowtimeLabel(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function formatDayHeading(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export function groupShowtimesByDay(showtimes: Showtime[]): { key: string; label: string; items: Showtime[] }[] {
  const groups = new Map<string, { key: string; label: string; items: Showtime[] }>();
  for (const showtime of showtimes) {
    const date = new Date(showtime.starts_at);
    const key = date.toDateString();
    const group = groups.get(key) ?? { key, label: formatDayHeading(showtime.starts_at), items: [] };
    group.items.push(showtime);
    groups.set(key, group);
  }
  return [...groups.values()];
}
