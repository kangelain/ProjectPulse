
import type { Project, KeyMilestone } from '@/types/project';
import type { Notification } from '@/types/notification';
import { NotificationType } from '@/types/notification';
import { differenceInDays, parseISO, formatDistanceToNowStrict } from 'date-fns';

const NOTIFICATION_EXPIRY_DAYS = 30; // Notifications older than this won't be shown/generated unless critical
const DEADLINE_THRESHOLD_DAYS = 7; // Notify for deadlines within this many days

function generateNotificationId(parts: (string | number | undefined)[]): string {
  return parts.filter(p => p !== undefined).join('-');
}

export function generateNotificationsForProject(project: Project, existingNotifications: Notification[]): Notification[] {
  const newNotifications: Notification[] = [];
  const today = new Date();

  const createNotification = (baseNotification: Omit<Notification, 'id' | 'date' | 'isRead'>): Notification | null => {
    const notificationId = generateNotificationId([
      project.id,
      baseNotification.type,
      (baseNotification as any).milestoneId, // Handle optional milestoneId
      // Add other distinguishing details if necessary, e.g., a specific date for recurring checks
    ]);

    // Check if a similar unread notification already exists
    const similarUnreadExists = existingNotifications.some(
      ex => ex.id === notificationId && !ex.isRead
    );
    if (similarUnreadExists) {
      return null; // Don't create a duplicate if an unread one exists
    }
    
    // Check if a read one exists for the same ID - if so, we might not re-notify for non-critical things
    // For simplicity in this demo, we will allow re-notification if it was previously read and condition persists.
    // A more advanced system would have smarter re-notification logic.

    return {
      ...baseNotification,
      id: notificationId,
      date: today.toISOString(),
      isRead: false,
    };
  };

  // 1. Project Deadline
  try {
    const projectEndDate = parseISO(project.endDate);
    const daysToProjectDeadline = differenceInDays(projectEndDate, today);
    if (daysToProjectDeadline >= 0 && daysToProjectDeadline <= DEADLINE_THRESHOLD_DAYS && project.status !== 'Completed') {
      const notification = createNotification({
        type: NotificationType.DEADLINE_PROJECT,
        projectId: project.id,
        projectName: project.name,
        message: `Project "${project.name}" is due in ${formatDistanceToNowStrict(projectEndDate, { addSuffix: true, unit: 'day' })}.`,
        details: { daysRemaining: daysToProjectDeadline, endDate: project.endDate },
      });
      if (notification) newNotifications.push(notification);
    }
  } catch (e) { console.error(`Error parsing project end date for ${project.name}: ${project.endDate}`, e); }


  // 2. Milestone Deadlines
  project.keyMilestones.forEach((milestone: KeyMilestone) => {
    if (milestone.status !== 'Completed') {
      try {
        const milestoneDate = parseISO(milestone.date);
        const daysToMilestoneDeadline = differenceInDays(milestoneDate, today);
        if (daysToMilestoneDeadline >= 0 && daysToMilestoneDeadline <= DEADLINE_THRESHOLD_DAYS) {
          const notification = createNotification({
            type: NotificationType.DEADLINE_MILESTONE,
            projectId: project.id,
            projectName: project.name,
            milestoneId: milestone.id,
            milestoneName: milestone.name,
            message: `Milestone "${milestone.name}" for project "${project.name}" is due in ${formatDistanceToNowStrict(milestoneDate, { addSuffix: true, unit: 'day' })}.`,
            details: { daysRemaining: daysToMilestoneDeadline, milestoneDate: milestone.date },
          });
          if (notification) newNotifications.push(notification);
        }
      } catch(e) { console.error(`Error parsing milestone date for ${project.name} - ${milestone.name}: ${milestone.date}`, e); }
    }
  });

  // 3. Budget Overrun
  if (project.spent > project.budget && project.status !== 'Completed') {
    const overrunAmount = project.spent - project.budget;
    const notification = createNotification({
      type: NotificationType.BUDGET_OVERRUN,
      projectId: project.id,
      projectName: project.name,
      message: `Project "${project.name}" is over budget by $${overrunAmount.toLocaleString()}.`,
      details: { budget: project.budget, spent: project.spent, overrunAmount },
    });
    if (notification) newNotifications.push(notification);
  }

  // 4. Project At Risk (Status)
  if (project.status === 'At Risk') {
    const notification = createNotification({
      type: NotificationType.PROJECT_AT_RISK,
      projectId: project.id,
      projectName: project.name,
      message: `Project "${project.name}" is marked as 'At Risk'.`,
      details: { status: project.status },
    });
    if (notification) newNotifications.push(notification);
  }

  // 5. Project Delayed (Status)
  if (project.status === 'Delayed') {
    const notification = createNotification({
      type: NotificationType.PROJECT_DELAYED,
      projectId: project.id,
      projectName: project.name,
      message: `Project "${project.name}" is marked as 'Delayed'.`,
      details: { status: project.status },
    });
    if (notification) newNotifications.push(notification);
  }
  
  // 6. Project High Risk Score (AI Assessment)
  if (project.riskAssessment && project.riskAssessment.overallRiskScore > 66 && project.status !== 'Completed') {
     const notification = createNotification({
      type: NotificationType.PROJECT_HIGH_RISK_SCORE,
      projectId: project.id,
      projectName: project.name,
      message: `Project "${project.name}" has a high AI risk score of ${project.riskAssessment.overallRiskScore}.`,
      details: { riskScore: project.riskAssessment.overallRiskScore },
    });
    if (notification) newNotifications.push(notification);
  }

  return newNotifications;
}

export function generateAllNotifications(projects: Project[], existingNotifications: Notification[]): Notification[] {
  const allGeneratedNotifications: Notification[] = [];
  projects.forEach(project => {
    const projectNotifications = generateNotificationsForProject(project, existingNotifications);
    allGeneratedNotifications.push(...projectNotifications);
  });

  // Filter out very old notifications (e.g., older than NOTIFICATION_EXPIRY_DAYS) unless they are critical and still active
  const now = new Date();
  return allGeneratedNotifications.filter(n => {
    const notificationDate = parseISO(n.date);
    const ageInDays = differenceInDays(now, notificationDate);
    // For this demo, we'll keep it simple and not implement complex expiry logic beyond initial generation.
    // A real system might also remove notifications for conditions that are no longer true.
    return ageInDays <= NOTIFICATION_EXPIRY_DAYS; 
  });
}
