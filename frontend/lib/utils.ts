import { type ClassValue, clsx } from 'clsx';
import { Currency } from './types';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(currency: Currency): string {
  const { type, amount } = currency;

  switch (type) {
    case 'cash':
      return `$${amount.toFixed(2)}`;
    case 'points':
      return `${amount} pts`;
    case 'favorTokens':
      return `${amount} favors`;
    case 'timeBank':
      return `${amount} min`;
    default:
      return `${amount}`;
  }
}

export function formatTimeRemaining(endTime: number): string {
  const now = Date.now();
  const remaining = endTime - now;

  if (remaining <= 0) return 'Ended';

  const seconds = Math.floor(remaining / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

export function getCurrencySymbol(type: Currency['type']): string {
  switch (type) {
    case 'cash':
      return '$';
    case 'points':
      return 'pts';
    case 'favorTokens':
      return 'favors';
    case 'timeBank':
      return 'min';
    default:
      return '';
  }
}
