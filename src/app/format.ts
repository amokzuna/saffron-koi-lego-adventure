/** Formats milliseconds as m:ss.t (e.g. 1:05.3). */
export function formatTime(ms: number): string {
  const safe = Math.max(0, Math.floor(ms / 100));
  const tenths = safe % 10;
  const totalSeconds = Math.floor(safe / 10);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}.${tenths}`;
}
