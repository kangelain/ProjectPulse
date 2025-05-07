
import type { Project } from '@/types/project';

export const mockProjects: Project[] = [
  {
    id: 'proj-001',
    name: 'Phoenix Initiative',
    status: 'On Track',
    description: 'A revolutionary new platform to integrate all enterprise services into a unified dashboard.',
    startDate: '2024-01-15',
    endDate: '2024-12-20',
    budget: 500000,
    spent: 120000,
    completionPercentage: 25,
    teamLead: 'Alice Wonderland',
    keyMilestones: [
      { id: 'm1-1', name: 'Initial Design Phase Complete', date: '2024-03-01', status: 'Completed' },
      { id: 'm1-2', name: 'Alpha Version Release', date: '2024-06-15', status: 'In Progress' },
      { id: 'm1-3', name: 'Beta Testing', date: '2024-09-01', status: 'Pending' },
    ],
    lastUpdated: '2024-07-20',
    priority: 'High',
    portfolio: 'Core Infrastructure',
  },
  {
    id: 'proj-002',
    name: 'Orion Data Migration',
    status: 'At Risk',
    description: 'Migrate legacy customer data to the new cloud infrastructure with zero downtime.',
    startDate: '2024-03-01',
    endDate: '2024-09-30',
    budget: 250000,
    spent: 180000,
    completionPercentage: 60,
    teamLead: 'Bob The Builder',
    keyMilestones: [
      { id: 'm2-1', name: 'Infrastructure Setup', date: '2024-04-01', status: 'Completed' },
      { id: 'm2-2', name: 'Test Data Migration', date: '2024-06-01', status: 'Completed' },
      { id: 'm2-3', name: 'Production Data Migration Window 1', date: '2024-08-15', status: 'Blocked' },
    ],
    lastUpdated: '2024-07-18',
    priority: 'High',
    portfolio: 'Core Infrastructure',
  },
  {
    id: 'proj-003',
    name: 'Nebula AI Integration',
    status: 'Delayed',
    description: 'Integrate a third-party AI module for advanced analytics into the existing CRM.',
    startDate: '2024-02-01',
    endDate: '2024-07-31',
    budget: 150000,
    spent: 140000,
    completionPercentage: 85,
    teamLead: 'Carol Danvers',
    keyMilestones: [
      { id: 'm3-1', name: 'API Key Acquisition', date: '2024-02-15', status: 'Completed' },
      { id: 'm3-2', name: 'Core Module Integration', date: '2024-05-01', status: 'Completed' },
      { id: 'm3-3', name: 'User Acceptance Testing', date: '2024-07-15', status: 'In Progress' },
    ],
    lastUpdated: '2024-07-15',
    priority: 'Medium',
    portfolio: 'Customer Experience',
  },
  {
    id: 'proj-004',
    name: 'Titan Security Overhaul',
    status: 'Completed',
    description: 'Comprehensive upgrade of all internal security protocols and systems.',
    startDate: '2023-09-01',
    endDate: '2024-03-31',
    budget: 300000,
    spent: 285000,
    completionPercentage: 100,
    teamLead: 'David Copperfield',
    keyMilestones: [
      { id: 'm4-1', name: 'System Audit', date: '2023-10-01', status: 'Completed' },
      { id: 'm4-2', name: 'Protocol Implementation', date: '2024-01-15', status: 'Completed' },
      { id: 'm4-3', name: 'Final Review & Sign-off', date: '2024-03-20', status: 'Completed' },
    ],
    lastUpdated: '2024-04-01',
    priority: 'High',
    portfolio: 'Core Infrastructure',
  },
   {
    id: 'proj-005',
    name: 'Nova Mobile App',
    status: 'Planning',
    description: 'Develop a new cross-platform mobile application for customer engagement.',
    startDate: '2024-08-01',
    endDate: '2025-02-28',
    budget: 400000,
    spent: 10000,
    completionPercentage: 5,
    teamLead: 'Eva Green',
    keyMilestones: [
      { id: 'm5-1', name: 'Market Research', date: '2024-08-30', status: 'In Progress' },
      { id: 'm5-2', name: 'UX/UI Design Specs', date: '2024-10-15', status: 'Pending' },
    ],
    lastUpdated: '2024-07-19',
    priority: 'Medium',
    portfolio: 'Innovation Lab',
  },
  {
    id: 'proj-006',
    name: 'Apollo Marketing Campaign',
    status: 'On Track',
    description: 'Launch a new marketing campaign for the Q4 product release.',
    startDate: '2024-07-01',
    endDate: '2024-10-31',
    budget: 120000,
    spent: 30000,
    completionPercentage: 20,
    teamLead: 'Frank Moses',
    keyMilestones: [
      { id: 'm6-1', name: 'Campaign Strategy Finalized', date: '2024-07-15', status: 'Completed' },
      { id: 'm6-2', name: 'Creative Assets Production', date: '2024-08-30', status: 'In Progress' },
      { id: 'm6-3', name: 'Campaign Launch', date: '2024-10-01', status: 'Pending' },
    ],
    lastUpdated: '2024-07-22',
    priority: 'Medium',
    portfolio: 'Customer Experience',
  }
];


export function updateMockProject(updatedProject: Project): void {
  const projectIndex = mockProjects.findIndex(p => p.id === updatedProject.id);
  if (projectIndex !== -1) {
    mockProjects[projectIndex] = { ...updatedProject };
  } else {
    // Optionally handle case where project to update is not found
    console.warn(`Project with id ${updatedProject.id} not found for update.`);
    // mockProjects.push(updatedProject); // Or add if not found, depending on desired behavior
  }
}
