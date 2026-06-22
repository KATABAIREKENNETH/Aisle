import { format, differenceInDays, parseISO } from 'date-fns';

export function formatDate(date: string | Date, formatStr: string = 'MMM d, yyyy') {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr);
}

export function getDaysUntil(date: string | Date) {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const today = new Date();
  return differenceInDays(dateObj, today);
}

export function isToday(date: string | Date) {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const today = new Date();
  return (
    dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear()
  );
}

export function isPast(date: string | Date) {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const today = new Date();
  return dateObj < today;
}

export function isFuture(date: string | Date) {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const today = new Date();
  return dateObj > today;
}
