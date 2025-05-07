import type { Project, ProjectStatus } from '@/types/project';
import { TrendingUp, AlertTriangle, Clock, CheckCircle2, Activity } from 'lucide-react';

export const statusStyles: Record<ProjectStatus, { badge: string, progress: string, text?: string }> = {
  'On Track': { badge: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700', progress: 'bg-green-500' },
  'At Risk': { badge: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700', progress: 'bg-red-500' },
  'Delayed': { badge: 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-600', progress: 'bg-yellow-500' },
  'Completed': { badge: 'bg-primary/10 text-primary border-primary/30', progress: 'bg-primary' },
  'Planning': { badge: 'bg-secondary text-secondary-foreground border-border', progress: 'bg-secondary-foreground' },
};

export const priorityColors: Record<Project['priority'], string> = {
  High: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700',
  Medium: 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-600',
  Low: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
};

export const statusIcons: Record<ProjectStatus, React.ElementType> = {
  'On Track': TrendingUp,
  'At Risk': AlertTriangle,
  'Delayed': Clock,
  'Completed': CheckCircle2,
  'Planning': Activity,
};
