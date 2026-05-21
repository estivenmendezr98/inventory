/** Evento global para refrescar contador de no leídas (header) tras cambios en la bandeja. */
export const NOTIFICATIONS_UPDATED_EVENT = 'inventory-notifications-updated';

export function emitNotificationsUpdated(): void {
  window.dispatchEvent(new Event(NOTIFICATIONS_UPDATED_EVENT));
}
