import { AUTH_EMAIL_DOMAIN } from '@/shared/constants';

export function mobileToAuthEmail(mobile: string): string {
  const cleaned = mobile.replace(/\D/g, '');
  return `${cleaned}@${AUTH_EMAIL_DOMAIN}`;
}

export function authEmailToMobile(email: string): string {
  return email.split('@')[0];
}

export function formatMobile(mobile: string): string {
  const cleaned = mobile.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{5})(\d{5})/, '$1 $2');
  }
  return cleaned;
}

export function validateMobile(mobile: string): boolean {
  return /^[6-9]\d{9}$/.test(mobile.replace(/\D/g, ''));
}

export function generateOrderNumber(count: number): string {
  return `MVR${String(count + 1).padStart(6, '0')}`;
}

export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
