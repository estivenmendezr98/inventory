export type NotificationPayload = {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  module: string | null;
  entityId: string | null;
  createdAt: string;
};
