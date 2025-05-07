import type { Project, ProjectStatus } from './project';

export interface CalculatedProjectMetrics {
  daysRemaining: number;
  isOverdue: boolean;
  timelineProgress: number;
}

export interface PortfolioSummary {
  portfolioName: string;
  totalProjects: number;
  averageCompletion: number;
  totalBudget: number;
  totalSpent: number;
  budgetVariance: number;
  statusCounts: Record<ProjectStatus, number>;
  projects: Project[]; // Full project objects for drill-down
}

export interface TeamLeadWorkload {
  teamLead: string;
  projectCount: number;
  activeProjectsCount: number;
  completedProjectsCount: number;
  averageCompletionPercentage: number;
  totalBudgetManaged: number;
  statusDistribution: Record<ProjectStatus, number>;
  projects: Array<{ 
    id: string; 
    name: string; 
    status: ProjectStatus; 
    priority: Project['priority'];
    completionPercentage: number 
  }>; // Subset for quick view
}

export interface TrendIndicator {
  metricName: string;
  currentValue: string | number;
  trend: 'Improving' | 'Declining' | 'Stable' | 'N/A';
  trendDescription: string;
  historicalComparison?: string;
}
