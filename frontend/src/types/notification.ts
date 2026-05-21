export interface NotificationRow {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  module: string | null;
  entityId: string | null;
  createdAt: string;
}

export interface NotificationListMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  unreadCount: number;
}

export interface NotificationListResponse {
  data: NotificationRow[];
  meta: NotificationListMeta;
}
