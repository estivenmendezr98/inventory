import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';
import { cn } from '../../lib/utils';

export interface HubLink {
  to: string;
  label: string;
  permission?: string;
}

interface DomainHubNavProps {
  links: HubLink[];
  className?: string;
}

export function DomainHubNav({ links, className }: DomainHubNavProps) {
  const { hasPermission } = useAuthStore();
  const visible = links.filter((l) => !l.permission || hasPermission(l.permission));
  if (visible.length === 0) return null;

  return (
    <nav
      className={cn(
        'flex flex-wrap gap-2 rounded-lg border border-border bg-muted/30 p-2',
        className
      )}
      aria-label="Módulos relacionados"
    >
      {visible.map((l) => (
        <Link
          key={l.to}
          to={l.to}
          className="rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
