
'use client';

import { useParams, useRouter } from 'next/navigation';
import { mockProjects } from '@/lib/mock-data';
import type { Project, KeyMilestone, ProjectStatus } from '@/types/project';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  CalendarDays,
  Users,
  DollarSign,
  ListChecks,
  Flag,
  Activity,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ChevronLeft,
  Edit3,
  BarChart3,
  GanttChartSquare,
  PieChartIcon,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ProjectTimelineGantt } from '@/components/project-timeline-gantt';
import { ProjectBudgetChart } from '@/components/project-budget-chart';
import { useState, useEffect } from 'react';

const statusIcons: Record<ProjectStatus, React.ElementType> = {
  'On Track': TrendingUp,
  'At Risk': AlertTriangle,
  'Delayed': Clock,
  'Completed': CheckCircle2,
  'Planning': Activity,
};

const statusColors: Record<ProjectStatus, string> = {
  'On Track': 'bg-green-500 text-white',
  'At Risk': 'bg-red-500 text-white',
  'Delayed': 'bg-yellow-500 text-white',
  'Completed': 'bg-blue-500 text-white',
  'Planning': 'bg-gray-500 text-white',
};

const priorityColors: Record<Project['priority'], string> = {
  High: 'border-red-500 text-red-700 dark:text-red-400',
  Medium: 'border-yellow-500 text-yellow-700 dark:text-yellow-400',
  Low: 'border-green-500 text-green-700 dark:text-green-400',
};

const milestoneStatusColors: Record<KeyMilestone['status'], string> = {
  'Pending': 'bg-gray-400',
  'In Progress': 'bg-blue-500',
  'Completed': 'bg-green-500',
  'Blocked': 'bg-red-500',
};

const milestoneStatusIcons: Record<KeyMilestone['status'], React.ElementType> = {
  'Pending': Clock,
  'In Progress': TrendingUp,
  'Completed': CheckCircle2,
  'Blocked': AlertTriangle,
};

interface ClientCalculatedMetrics {
  daysRemaining: number;
  timelineProgress: number;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const project = mockProjects.find((p) => p.id === projectId);
  const [clientCalculatedMetrics, setClientCalculatedMetrics] = useState<ClientCalculatedMetrics | null>(null);

  useEffect(() => {
    if (project) {
      const now = new Date();
      const endDate = parseISO(project.endDate);
      const startDate = parseISO(project.startDate);

      const daysRemaining = differenceInDays(endDate, now);
      const totalProjectDuration = differenceInDays(endDate, startDate);
      const daysPassed = Math.max(0, differenceInDays(now, startDate));
      const timelineProgress = totalProjectDuration > 0 ? Math.min(100, Math.max(0, (daysPassed / totalProjectDuration) * 100)) : 0;
      
      setClientCalculatedMetrics({
        daysRemaining,
        timelineProgress,
      });
    }
  }, [project]);


  if (!project) {
    return (
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-2xl font-semibold mb-4">Project Not Found</h1>
        <p className="text-muted-foreground mb-6">
          The project you are looking for does not exist or could not be loaded.
        </p>
        <Button onClick={() => router.push('/')}>
          <ChevronLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>
      </div>
    );
  }

  const StatusIcon = statusIcons[project.status] || Activity;
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM dd, yyyy');
    } catch (error) {
      return 'N/A';
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" onClick={() => router.back()} size="sm">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex items-center space-x-2">
             {/* Placeholder for future edit/actions */}
            {/* <Button variant="outline" size="sm">
                <Edit3 className="mr-2 h-4 w-4" /> Edit Project
            </Button> */}
        </div>
      </div>

      <Card className="mb-8 shadow-xl">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <CardTitle className="text-3xl font-bold text-primary mb-2 sm:mb-0">{project.name}</CardTitle>
            <Badge className={cn('text-sm font-semibold px-3 py-1', statusColors[project.status])}>
              <StatusIcon className="mr-2 h-5 w-5" />
              {project.status}
            </Badge>
          </div>
          <CardDescription className="text-md pt-2">{project.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="mb-1 flex justify-between text-sm text-muted-foreground">
              <span>Task Completion</span>
              <span>{project.completionPercentage}%</span>
            </div>
            <Progress value={project.completionPercentage} aria-label={`${project.completionPercentage}% complete`} className="h-3" />
          </div>
           <div>
            <div className="mb-1 flex justify-between text-sm text-muted-foreground">
              <span>Timeline Progress</span>
               {clientCalculatedMetrics ? (
                 <span>
                  {clientCalculatedMetrics.daysRemaining >=0 ? `${clientCalculatedMetrics.daysRemaining} days remaining` : `${Math.abs(clientCalculatedMetrics.daysRemaining)} days overdue`}
                  </span>
               ) : (
                 <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
               )}
            </div>
            {clientCalculatedMetrics ? (
              <Progress value={clientCalculatedMetrics.timelineProgress} aria-label={`Timeline ${clientCalculatedMetrics.timelineProgress}% complete`} className="h-3" indicatorClassName={clientCalculatedMetrics.daysRemaining < 0 && project.status !== 'Completed' ? 'bg-red-500' : ''} />
            ) : (
              <Progress value={0} aria-label="Loading timeline progress" className="h-3" />
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
            <div className="flex items-start space-x-3 p-3 bg-secondary/30 rounded-md">
              <CalendarDays className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Timeline</p>
                <p className="text-muted-foreground">Start: {formatDate(project.startDate)}</p>
                <p className="text-muted-foreground">End: {formatDate(project.endDate)}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-secondary/30 rounded-md">
              <Users className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Team & Stakeholders</p>
                <p className="text-muted-foreground">Lead: {project.teamLead}</p>
                <p className="text-muted-foreground">Portfolio: {project.portfolio}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-secondary/30 rounded-md">
              <DollarSign className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Financials</p>
                <p className="text-muted-foreground">Budget: ${project.budget.toLocaleString()}</p>
                <p className="text-muted-foreground">Spent: ${project.spent.toLocaleString()}</p>
                <p className={cn(
                    "text-xs", 
                    project.spent > project.budget ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
                )}>
                    {project.spent > project.budget 
                        ? `Over budget by $${(project.spent - project.budget).toLocaleString()}`
                        : `Remaining: $${(project.budget - project.spent).toLocaleString()}`
                    }
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-secondary/30 rounded-md">
              <Flag className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Priority</p>
                <Badge variant="outline" className={cn("text-sm", priorityColors[project.priority])}>
                  {project.priority}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground pt-4 border-t">
          Last updated: {formatDate(project.lastUpdated)}
        </CardFooter>
      </Card>

      <Card className="mb-8 shadow-xl">
        <CardHeader>
            <div className="flex items-center">
                 <ListChecks className="h-6 w-6 mr-3 text-primary" />
                <CardTitle>Key Milestones</CardTitle>
            </div>
          <CardDescription>Track the progress of important project milestones.</CardDescription>
        </CardHeader>
        <CardContent>
          {project.keyMilestones.length > 0 ? (
            <ul className="space-y-4">
              {project.keyMilestones.map((milestone) => {
                const MilestoneStatusIcon = milestoneStatusIcons[milestone.status];
                return (
                  <li key={milestone.id} className="flex items-start space-x-3 p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow">
                     <Badge
                      className={cn(
                        'mt-1 px-2 py-1 text-xs font-semibold text-white shrink-0',
                        milestoneStatusColors[milestone.status]
                      )}
                      aria-label={`Milestone status: ${milestone.status}`}
                    >
                      <MilestoneStatusIcon className="h-3.5 w-3.5" />
                    </Badge>
                    <div className="flex-grow">
                      <p className="font-semibold text-foreground">{milestone.name}</p>
                      <p className="text-sm text-muted-foreground">Target Date: {formatDate(milestone.date)}</p>
                    </div>
                     <span className="text-sm text-muted-foreground whitespace-nowrap">{milestone.status}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-muted-foreground text-center py-4">No key milestones defined for this project.</p>
          )}
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
         <Card className="shadow-xl">
            <CardHeader>
                <div className="flex items-center">
                    <GanttChartSquare className="h-6 w-6 mr-3 text-primary" />
                    <CardTitle>Project Timeline (Gantt)</CardTitle>
                </div>
                <CardDescription>Visual representation of the project schedule.</CardDescription>
            </CardHeader>
            <CardContent>
                <ProjectTimelineGantt projects={[project]} />
            </CardContent>
        </Card>
        <Card className="shadow-xl">
            <CardHeader>
                <div className="flex items-center">
                    <PieChartIcon className="h-6 w-6 mr-3 text-primary" />
                    <CardTitle>Budget Overview</CardTitle>
                </div>
                <CardDescription>Budget allocation and spending for this project.</CardDescription>
            </CardHeader>
            <CardContent>
                <ProjectBudgetChart projects={[project]} />
            </CardContent>
        </Card>
      </div>


      {/* Placeholder for future sections like Related Documents, Team Members, Risk Log etc. */}
      {/* <Card className="shadow-xl">
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">More details will be available here in future updates.</p>
        </CardContent>
      </Card> */}
    </div>
  );
}

