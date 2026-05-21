import { Link } from 'react-router-dom';
import { referencePath, resolveKardexReference } from '../../lib/module-links';

interface KardexReferenceLinkProps {
  referenceType: string | null;
  referenceId: string | null;
}

export function KardexReferenceLink({ referenceType, referenceId }: KardexReferenceLinkProps) {
  const ref = resolveKardexReference(referenceType, referenceId);
  const path = referencePath(ref);

  if (!path) {
    return <span className="text-xs text-muted-foreground">{ref.label}</span>;
  }

  return (
    <Link
      to={path}
      className="text-xs font-medium text-primary hover:underline"
      onClick={(e) => e.stopPropagation()}
    >
      {ref.label}
    </Link>
  );
}
