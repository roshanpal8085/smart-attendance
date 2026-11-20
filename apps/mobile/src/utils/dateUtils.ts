import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import localizedFormat from 'dayjs/plugin/localizedFormat';

dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);

export function formatDate(date: string | Date, format = 'YYYY-MM-DD'): string {
  return dayjs(date).format(format);
}

export function formatTime(timeString: string): string {
  if (!timeString) return '';
  if (timeString.includes('T')) {
    return dayjs(timeString).format('hh:mm A');
  }
  // If in HH:mm format, parse with dummy date
  const [hours, minutes] = timeString.split(':');
  if (hours !== undefined && minutes !== undefined) {
    const dummy = dayjs().hour(parseInt(hours, 10)).minute(parseInt(minutes, 10));
    return dummy.format('hh:mm A');
  }
  return timeString;
}

export function formatHumanDate(date: string | Date): string {
  return dayjs(date).format('ddd, MMM D, YYYY');
}

export function formatMonthYear(date: string | Date): string {
  return dayjs(date).format('MMMM YYYY');
}

/**
 * Calculates remaining seconds until an ISO 8601 expires_at timestamp.
 * Returns 0 if already expired.
 */
export function getRemainingSeconds(expiresAtIso: string): number {
  if (!expiresAtIso) return 0;
  const now = dayjs();
  const target = dayjs(expiresAtIso);
  const diffSec = target.diff(now, 'second');
  return Math.max(0, diffSec);
}

/**
 * Formats a duration in seconds as MM:SS
 */
export function formatSecondsToMinutes(seconds: number): string {
  const safeSec = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safeSec / 60);
  const remSec = safeSec % 60;
  return `${mins.toString().padStart(2, '0')}:${remSec.toString().padStart(2, '0')}`;
}

/**
 * Formats seconds into human-readable duration, e.g. "15 min 0 sec"
 */
export function formatDurationHuman(seconds: number): string {
  const safeSec = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safeSec / 60);
  const remSec = safeSec % 60;
  if (mins === 0) {
    return `${remSec} sec`;
  }
  return `${mins} min ${remSec} sec`;
}

/**
 * Checks if a class time window is active now.
 * Takes start_time "09:00" and end_time "10:00"
 */
export function isSlotActiveNow(startTime: string, endTime: string): boolean {
  const now = dayjs();
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);

  const start = dayjs().hour(startH).minute(startM).second(0);
  const end = dayjs().hour(endH).minute(endM).second(0);

  return now.isAfter(start) && now.isBefore(end);
}

export {dayjs};
