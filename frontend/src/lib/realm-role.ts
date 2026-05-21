import { normalizeRoleName } from './role-permissions-fallback';

const REALM_APP_ROLES = ['SUPER_ADMINISTRADOR', 'ADMINISTRADOR', 'CAJERO'] as const;

/** Elige el rol de aplicación a partir de los roles del token (Keycloak). */
export function pickAppRoleFromToken(realmRoles: string[] | undefined): string {
  const list = realmRoles ?? [];
  const normalized = new Set(list.map((r) => normalizeRoleName(r)));
  for (const canonical of REALM_APP_ROLES) {
    if (normalized.has(canonical)) return canonical;
  }
  return 'CAJERO';
}
