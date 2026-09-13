import confetti from 'canvas-confetti';

export function formatDate(dateString?: string): string {
  if (!dateString) return 'No date';
  try {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: year !== new Date().getFullYear() ? 'numeric' : undefined,
      });
    }
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? dateString : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateTimeString?: string): string {
  if (!dateTimeString) return '';
  try {
    const d = new Date(dateTimeString);
    if (isNaN(d.getTime())) return dateTimeString;
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return dateTimeString;
  }
}

export function getRelativeDueDateLabel(dueDate?: string): {
  label: string;
  isOverdue: boolean;
  isToday: boolean;
  isSoon: boolean;
} {
  if (!dueDate) return { label: 'No due date', isOverdue: false, isToday: false, isSoon: false };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parts = dueDate.split('-');
  if (parts.length !== 3) {
    return { label: dueDate, isOverdue: false, isToday: false, isSoon: false };
  }

  const target = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  target.setHours(0, 0, 0, 0);

  const diffMs = target.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const daysAgo = Math.abs(diffDays);
    return {
      label: daysAgo === 1 ? 'Overdue yesterday' : `Overdue by ${daysAgo}d`,
      isOverdue: true,
      isToday: false,
      isSoon: false,
    };
  }

  if (diffDays === 0) {
    return { label: 'Due today', isOverdue: false, isToday: true, isSoon: true };
  }

  if (diffDays === 1) {
    return { label: 'Due tomorrow', isOverdue: false, isToday: false, isSoon: true };
  }

  if (diffDays <= 3) {
    return { label: `In ${diffDays} days`, isOverdue: false, isToday: false, isSoon: true };
  }

  return { label: formatDate(dueDate), isOverdue: false, isToday: false, isSoon: false };
}

export function isDueToday(dateString?: string): boolean {
  if (!dateString) return false;
  const today = new Date().toISOString().split('T')[0];
  return dateString.startsWith(today);
}

export function isOverdue(dateString?: string): boolean {
  if (!dateString) return false;
  const today = new Date().toISOString().split('T')[0];
  return dateString < today;
}

export const formatDisplayDate = formatDate;

export function fireCelebrationConfetti() {
  try {
    confetti({
      particleCount: 65,
      spread: 70,
      origin: { y: 0.65 },
      colors: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'],
    });
  } catch (err) {
    console.debug('Confetti skipped', err);
  }
}

export function generateId(prefix: string = 'item'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
}
