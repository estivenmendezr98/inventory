export type AuditOperation = 'CREATE' | 'UPDATE' | 'DELETE' | 'SYNC' | 'OTHER';
export type AuditSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AuditDiffKind = 'added' | 'removed' | 'changed';

export interface AuditUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roleName: string | null;
}

export interface AuditPlainPresentation {
  title: string;
  story: string;
  who: string;
  when: string;
  area: string;
  whatChanged: string[];
  whyItMatters: string;
  operationLabel: string;
  severityLabel: string;
}

export interface AuditPresentation {
  moduleLabel: string;
  actionLabel: string;
  operation: AuditOperation;
  severity: AuditSeverity;
  hint: string | null;
  summary: string;
  technicalSummary: string;
  plain: AuditPlainPresentation;
}

export interface AuditFieldChange {
  path: string;
  kind: AuditDiffKind;
  oldValue: unknown;
  newValue: unknown;
  oldDisplay: string;
  newDisplay: string;
  pathLabel?: string;
  plainDescription?: string;
}

export interface AuditLogRow {
  id: string;
  action: string;
  module: string;
  entityId: string | null;
  entityType: string | null;
  oldData: unknown;
  newData: unknown;
  ipAddress: string | null;
  createdAt: string;
  createdAtBogota: string;
  user: AuditUser | null;
  presentation: AuditPresentation;
  diff: AuditFieldChange[];
  metrics: {
    diffCount: number;
    addedCount: number;
    removedCount: number;
    changedCount: number;
    hasOldPayload: boolean;
    hasNewPayload: boolean;
  };
}

export interface AuditListResponse {
  data: AuditLogRow[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    filtersApplied: string[];
  };
}

export interface AuditMetaResponse {
  total: number;
  modules: { value: string; label: string; count: number }[];
  actions: { value: string; label: string }[];
  entityTypes: string[];
  operations: readonly AuditOperation[];
  severities: readonly AuditSeverity[];
}
