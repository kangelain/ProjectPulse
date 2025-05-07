
export enum NotificationType {
  DEADLINE_PROJECT = 'DEADLINE_PROJECT',
  DEADLINE_MILESTONE = 'DEADLINE_MILESTONE',
  BUDGET_OVERRUN = 'BUDGET_OVERRUN',
  PROJECT_AT_RISK = 'PROJECT_AT_RISK',
  PROJECT_DELAYED = 'PROJECT_DELAYED',
  PROJECT_HIGH_RISK_SCORE = 'PROJECT_HIGH_RISK_SCORE',
}

export interface Notification {
  id: string;
  type: NotificationType;
  projectId: string;
  projectName: string;
  milestoneId?: string;
  milestoneName?: string;
  message: string;
  date: string; // ISO string for when the notification was generated or pertains to
  isRead: boolean;
  details?: Record<string, any>; // For extra info like days remaining, overrun amount
}
