export type AuditDiffKind = 'added' | 'removed' | 'changed';

export interface AuditFieldChange {
  path: string;
  kind: AuditDiffKind;
  oldValue: unknown;
  newValue: unknown;
  oldDisplay: string;
  newDisplay: string;
}

function displayValue(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Diff plano de campos para la UI (objetos anidados con notación por punto). */
export function buildAuditFieldDiff(
  oldData: unknown,
  newData: unknown,
  maxDepth = 6,
): AuditFieldChange[] {
  const changes: AuditFieldChange[] = [];

  const walk = (oldVal: unknown, newVal: unknown, path: string, depth: number) => {
    if (depth > maxDepth) {
      if (displayValue(oldVal) !== displayValue(newVal)) {
        changes.push({
          path: path || '(raíz)',
          kind: 'changed',
          oldValue: oldVal,
          newValue: newVal,
          oldDisplay: displayValue(oldVal),
          newDisplay: displayValue(newVal),
        });
      }
      return;
    }

    if (oldVal === undefined && newVal === undefined) return;

    if (oldVal === undefined || oldVal === null) {
      if (newVal !== undefined && newVal !== null) {
        changes.push({
          path: path || '(raíz)',
          kind: 'added',
          oldValue: null,
          newValue: newVal,
          oldDisplay: '—',
          newDisplay: displayValue(newVal),
        });
      }
      return;
    }

    if (newVal === undefined || newVal === null) {
      changes.push({
        path: path || '(raíz)',
        kind: 'removed',
        oldValue: oldVal,
        newValue: null,
        oldDisplay: displayValue(oldVal),
        newDisplay: '—',
      });
      return;
    }

    if (isPlainObject(oldVal) && isPlainObject(newVal)) {
      const keys = new Set([...Object.keys(oldVal), ...Object.keys(newVal)]);
      for (const key of [...keys].sort()) {
        const childPath = path ? `${path}.${key}` : key;
        walk(oldVal[key], newVal[key], childPath, depth + 1);
      }
      return;
    }

    if (Array.isArray(oldVal) && Array.isArray(newVal)) {
      if (displayValue(oldVal) !== displayValue(newVal)) {
        changes.push({
          path: path || '(raíz)',
          kind: 'changed',
          oldValue: oldVal,
          newValue: newVal,
          oldDisplay: displayValue(oldVal),
          newDisplay: displayValue(newVal),
        });
      }
      return;
    }

    if (displayValue(oldVal) !== displayValue(newVal)) {
      changes.push({
        path: path || '(raíz)',
        kind: 'changed',
        oldValue: oldVal,
        newValue: newVal,
        oldDisplay: displayValue(oldVal),
        newDisplay: displayValue(newVal),
      });
    }
  };

  walk(oldData ?? null, newData ?? null, '', 0);
  return changes;
}
