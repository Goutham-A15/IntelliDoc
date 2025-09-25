export type NotificationCategory = 'billing' | 'report' | 'system' | 'account';

export interface Notification {
  id: string;
  category: NotificationCategory;
  title: string;
  description: string;
  timestamp: Date;
  read: boolean;
}
