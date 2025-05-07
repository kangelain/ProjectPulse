import type { AssessProjectRiskOutput } from '@/ai/flows/risk-assessment';

export type ProjectStatus = 'On Track' | 'At Risk' | 'Delayed' | 'Completed' | 'Planning';

export interface KeyMilestone {
  id: string;
  name: string;
  date: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Blocked';
}

export interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  description: string;
  startDate: string;
  endDate: string;
  budget: number;
  spent: number;
  completionPercentage: number;
  teamLead: string;
  keyMilestones: KeyMilestone[];
  lastUpdated: string;
  priority: 'High' | 'Medium' | 'Low';
  portfolio: string; // Added portfolio field
  riskAssessment?: AssessProjectRiskOutput; // Added field for AI risk assessment results
}
