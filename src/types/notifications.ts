export interface Notification {
  id: string;
  createdBy: {
    id: string;
    name: string;
    image: string | null;
  };
  firstMessage: string;
  secondMessage: string | null;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationResponse {
  success: boolean;
  message: string;
  notifications: Notification[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}
