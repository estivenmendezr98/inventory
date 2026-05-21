import type { AuditActionMeta } from './audit-catalog';
import { moduleLabel } from './audit-catalog';
import type { AuditFieldChange } from './audit-diff.util';
import {
  entityTypeLabel,
  fieldPathLabel,
  permissionCodeLabel,
  roleNameLabel,
} from './audit-field-labels';

const SEVERITY_PLAIN: Record<string, string> = {
  low: 'Importancia baja',
  medium: 'Importancia media',
  high: 'Importancia alta',
  critical: 'Muy importante — revisar con atención',
};

const OPERATION_PLAIN: Record<string, string> = {
  CREATE: 'Se creó algo nuevo',
  UPDATE: 'Se modificó algo existente',
  DELETE: 'Se eliminó o desactivó',
  SYNC: 'Se sincronizó con el sistema de acceso',
  OTHER: 'Ocurrió un cambio en el sistema',
};

type PlainActor = {
  firstName: string;
  lastName: string;
  email: string;
  roleName: string | null;
} | null;

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

function actorName(actor: PlainActor): string {
  if (!actor) return 'El sistema (automático)';
  const name = `${actor.firstName} ${actor.lastName}`.trim();
  return name || actor.email;
}

function truncatePlain(text: string, max = 120): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function describeDiffLine(d: AuditFieldChange): string {
  const label = fieldPathLabel(d.path);
  if (d.path === 'permissionCodes' || d.path.endsWith('.permissionCodes')) {
    return formatPermissionListChange(d);
  }
  const oldS = truncatePlain(d.oldDisplay, 80);
  const newS = truncatePlain(d.newDisplay, 80);
  if (d.kind === 'added') return `Se agregó «${label}»: ${newS}`;
  if (d.kind === 'removed') return `Se quitó «${label}» (antes era: ${oldS})`;
  return `«${label}» cambió de «${oldS}» a «${newS}»`;
}

function formatPermissionListChange(d: AuditFieldChange): string {
  try {
    const oldList = JSON.parse(d.oldDisplay);
    const newList = JSON.parse(d.newDisplay);
    if (Array.isArray(oldList) && Array.isArray(newList)) {
      const added = (newList as string[]).filter((c) => !(oldList as string[]).includes(c));
      const removed = (oldList as string[]).filter((c) => !(newList as string[]).includes(c));
      const parts: string[] = [];
      if (added.length) {
        parts.push(
          `permisos nuevos: ${added.slice(0, 5).map(permissionCodeLabel).join(', ')}${added.length > 5 ? ` y ${added.length - 5} más` : ''}`,
        );
      }
      if (removed.length) {
        parts.push(
          `permisos quitados: ${removed.slice(0, 5).map(permissionCodeLabel).join(', ')}${removed.length > 5 ? ` y ${removed.length - 5} más` : ''}`,
        );
      }
      if (parts.length) return `En el rol: ${parts.join('; ')}`;
    }
  } catch {
    /* fallback */
  }
  return `Se modificaron los permisos del rol.`;
}

function buildActionSpecificPlain(
  action: string,
  row: {
    entityId: string | null;
    entityType: string | null;
    oldData: unknown;
    newData: unknown;
  },
  actor: PlainActor,
  diff: AuditFieldChange[],
): { title: string; story: string; whatChanged: string[]; whyItMatters: string } | null {
  const who = actorName(actor);
  const entity = entityTypeLabel(row.entityType);

  switch (action) {
    case 'user.create': {
      const nd = row.newData as { email?: string; roleName?: string } | null;
      return {
        title: 'Nuevo usuario en el sistema',
        story: `${who} creó la cuenta de ${nd?.email ?? 'un usuario'} con rol de ${roleNameLabel(nd?.roleName ?? null)}.`,
        whatChanged: [
          `Correo: ${nd?.email ?? '—'}`,
          `Rol: ${roleNameLabel(nd?.roleName ?? null)}`,
        ],
        whyItMatters:
          'Esta persona podrá iniciar sesión y operar según los permisos de su rol.',
      };
    }
    case 'user.update': {
      const nd = row.newData as { roleName?: string; isActive?: boolean; passwordChanged?: boolean } | null;
      const lines = diff.slice(0, 8).map(describeDiffLine);
      if (nd?.passwordChanged) lines.unshift('Se cambió la contraseña de acceso.');
      return {
        title: 'Datos de un usuario fueron modificados',
        story: `${who} actualizó la información del usuario${nd?.roleName ? ` (rol: ${roleNameLabel(nd.roleName)})` : ''}.`,
        whatChanged: lines.length ? lines : ['Se modificaron datos del perfil del usuario.'],
        whyItMatters:
          'Los cambios afectan quién puede entrar al sistema y qué puede hacer dentro de la aplicación.',
      };
    }
    case 'user.deactivate': {
      const od = row.oldData as { email?: string } | null;
      return {
        title: 'Un usuario fue desactivado',
        story: `${who} desactivó la cuenta ${od?.email ?? 'de un usuario'}. Ya no debería poder iniciar sesión.`,
        whatChanged: ['La cuenta quedó marcada como inactiva.'],
        whyItMatters: 'Es una medida de seguridad cuando alguien deja la empresa o no debe operar el sistema.',
      };
    }
    case 'user.sync_keycloak': {
      const nd = row.newData as { updated?: number; skipped?: number } | null;
      return {
        title: 'Sincronización de usuarios con el acceso',
        story: `${who} ejecutó una sincronización masiva: ${nd?.updated ?? 0} cuentas actualizadas y ${nd?.skipped ?? 0} sin cambios.`,
        whatChanged: [
          `${nd?.updated ?? 0} usuario(s) actualizado(s)`,
          `${nd?.skipped ?? 0} omitido(s)`,
        ],
        whyItMatters:
          'Alinea las cuentas del inventario con el servidor de inicio de sesión (Keycloak).',
      };
    }
    case 'role.permissions_update': {
      const od = row.oldData as { roleName?: string } | null;
      const lines = diff.filter((d) => d.path.includes('permission')).map(describeDiffLine);
      return {
        title: `Cambio de permisos del rol «${od?.roleName ?? 'rol'}»`,
        story: `${who} modificó qué puede hacer cada persona con el rol ${od?.roleName ?? 'seleccionado'}.`,
        whatChanged: lines.length ? lines : ['Se actualizó la lista de permisos del rol.'],
        whyItMatters:
          'Define qué menús, botones y acciones verán los usuarios con ese rol. Un error aquí puede dar acceso de más o quitar funciones necesarias.',
      };
    }
    case 'inventory.adjust': {
      const od = row.oldData as { previousQty?: number; sku?: string; productName?: string };
      const nd = row.newData as { newQty?: number; reason?: string; delta?: number };
      const prev = od?.previousQty;
      const next = nd?.newQty;
      const reason = nd?.reason;
      const productLabel =
        od?.sku || od?.productName
          ? ` (${[od.sku, od.productName].filter(Boolean).join(' — ')})`
          : '';
      return {
        title: 'Ajuste manual de inventario',
        story: `${who} cambió el stock${productLabel} de ${prev ?? '?'} a ${next ?? '?'} unidades${reason ? ` por el motivo: «${reason}»` : ''}.`,
        whatChanged: [
          ...(od?.productName ? [`Producto: ${od.productName}`] : []),
          ...(od?.sku ? [`SKU: ${od.sku}`] : []),
          `Cantidad anterior: ${prev ?? '—'}`,
          `Cantidad nueva: ${next ?? '—'}`,
          ...(nd?.delta != null ? [`Variación: ${nd.delta > 0 ? '+' : ''}${nd.delta}`] : []),
          ...(reason ? [`Motivo: ${reason}`] : []),
        ],
        whyItMatters:
          'El stock mostrado en ventas y reportes cambia. Debe haber un motivo válido (conteo, merma, corrección).',
      };
    }
    case 'sale.create': {
      const nd = row.newData as { saleNumber?: string; total?: string; items?: unknown[] };
      return {
        title: 'Nueva venta registrada',
        story: `${who} registró la venta ${nd?.saleNumber ?? ''} por un total de $${nd?.total ?? '—'}.`,
        whatChanged: [
          `Número de venta: ${nd?.saleNumber ?? '—'}`,
          `Total: $${nd?.total ?? '—'}`,
          `Líneas de producto: ${Array.isArray(nd?.items) ? nd.items.length : '—'}`,
        ],
        whyItMatters:
          'Descuenta inventario, registra pagos y puede generar factura automática.',
      };
    }
    case 'sale.cancel': {
      const od = row.oldData as { saleNumber?: string; total?: string };
      return {
        title: 'Venta anulada',
        story: `${who} anuló la venta ${od?.saleNumber ?? ''} (total $${od?.total ?? '—'}). El stock fue devuelto.`,
        whatChanged: ['Estado: anulada', 'Inventario: restaurado según líneas de la venta'],
        whyItMatters: 'Afecta reportes de ventas, caja y la factura asociada si existía.',
      };
    }
    case 'invoice.create': {
      const nd = row.newData as { fullNumber?: string; total?: string; saleNumber?: string };
      return {
        title: 'Factura emitida',
        story: `${who} emitió la factura ${nd?.fullNumber ?? ''} por $${nd?.total ?? '—'}${nd?.saleNumber ? ` (venta ${nd.saleNumber})` : ''}.`,
        whatChanged: [
          `Factura: ${nd?.fullNumber ?? '—'}`,
          `Total facturado: $${nd?.total ?? '—'}`,
        ],
        whyItMatters: 'Documento legal de venta; usa consecutivo de numeración autorizada.',
      };
    }
    case 'invoice.cancel': {
      const od = row.oldData as { fullNumber?: string; total?: string };
      return {
        title: 'Factura anulada',
        story: `${who} anuló la factura ${od?.fullNumber ?? ''} (total $${od?.total ?? '—'}).`,
        whatChanged: ['Estado de factura: anulada'],
        whyItMatters: 'El comprobante deja de ser válido para reimpresión como documento vigente.',
      };
    }
    case 'sale.adjust': {
      const oldTotal = (row.oldData as { total?: string })?.total;
      const newTotal = (row.newData as { total?: string })?.total;
      const reason = (row.newData as { reason?: string })?.reason;
      return {
        title: 'Corrección de una venta',
        story: `${who} ajustó una ${entity}${oldTotal && newTotal ? `: el total pasó de $${oldTotal} a $${newTotal}` : ''}.${reason ? ` Motivo: «${reason}».` : ''}`,
        whatChanged: diff.slice(0, 6).map(describeDiffLine),
        whyItMatters:
          'Puede afectar caja, inventario y facturación electrónica. Suele requerir revisar la factura asociada.',
      };
    }
    case 'cash_register.session_adjust':
      return {
        title: 'Corrección de cierre o arqueo de caja',
        story: `${who} corrigió montos de una sesión de caja (apertura, cierre o arqueo).`,
        whatChanged: diff.slice(0, 8).map(describeDiffLine),
        whyItMatters:
          'Impacta el cuadre de dinero del turno. Debe documentarse por qué se corrigió.',
      };
    case 'cash_register.movement_adjust':
      return {
        title: 'Corrección de un movimiento de caja',
        story: `${who} modificó un ingreso o egreso registrado en caja.`,
        whatChanged: diff.slice(0, 6).map(describeDiffLine),
        whyItMatters: 'Altera el saldo y el historial del turno de caja.',
      };
    case 'cash_register.movement_delete':
      return {
        title: 'Eliminación de un movimiento de caja',
        story: `${who} eliminó un movimiento de dinero de la sesión de caja.`,
        whatChanged: diff.slice(0, 4).map(describeDiffLine),
        whyItMatters: 'El movimiento ya no aparece en el arqueo; conviene verificar que fue intencional.',
      };
    default:
      return null;
  }
}

export function buildPlainPresentation(
  row: {
    action: string;
    module: string;
    entityId: string | null;
    entityType: string | null;
    oldData: unknown;
    newData: unknown;
    createdAtBogota: string;
    user: PlainActor;
  },
  meta: AuditActionMeta,
  diff: AuditFieldChange[],
): AuditPlainPresentation {
  const actor = row.user;
  const who = actorName(actor);
  const area = moduleLabel(row.module);
  const specific = buildActionSpecificPlain(row.action, row, actor, diff);

  const whatFromDiff =
    diff.length > 0
      ? diff.slice(0, 10).map(describeDiffLine)
      : [];

  const title = specific?.title ?? `${meta.label} en ${area}`;
  const story =
    specific?.story ??
    `${who} realizó «${meta.label.toLowerCase()}» en el área de ${area}.`;
  const whatChanged =
    specific?.whatChanged?.length
      ? specific.whatChanged
      : whatFromDiff.length
        ? whatFromDiff
        : [OPERATION_PLAIN[meta.operation] ?? 'Hubo un cambio registrado.'];
  const whyItMatters =
    specific?.whyItMatters ??
    meta.hint ??
    'Quedó registrado para control interno y trazabilidad.';

  return {
    title,
    story,
    who,
    when: row.createdAtBogota,
    area,
    whatChanged,
    whyItMatters,
    operationLabel: OPERATION_PLAIN[meta.operation] ?? 'Cambio en el sistema',
    severityLabel: SEVERITY_PLAIN[meta.severity] ?? 'Importancia media',
  };
}

export function enrichDiffForPeople(diff: AuditFieldChange[]): (AuditFieldChange & {
  pathLabel: string;
  plainDescription: string;
})[] {
  return diff.map((d) => ({
    ...d,
    pathLabel: fieldPathLabel(d.path),
    plainDescription: describeDiffLine(d),
  }));
}
