import type { LucideIcon } from 'lucide-react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

export function notificationTypeClasses(type: string): string {
  switch (type) {
    case 'warning':
      return 'border-amber-500/40 bg-amber-500/10';
    case 'error':
      return 'border-destructive/40 bg-destructive/10';
    case 'success':
      return 'border-green-500/40 bg-green-500/10';
    default:
      return 'border-border bg-card';
  }
}

export function notificationTypeIcon(type: string): LucideIcon {
  switch (type) {
    case 'warning':
      return AlertTriangle;
    case 'error':
      return AlertCircle;
    case 'success':
      return CheckCircle2;
    default:
      return Info;
  }
}

export function notificationTypeDotClass(type: string): string {
  switch (type) {
    case 'warning':
      return 'bg-amber-500';
    case 'error':
      return 'bg-destructive';
    case 'success':
      return 'bg-green-500';
    default:
      return 'bg-primary';
  }
}
