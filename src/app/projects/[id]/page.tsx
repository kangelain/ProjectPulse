
'use client';

import { useParams, useRouter } from 'next/navigation';
import { mockProjects, updateMockProject } from '@/lib/mock-data';
import type { Project, KeyMilestone, ProjectStatus } from '@/types/project';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import {
  CalendarDays,
  Users,
  DollarSign,
  ListChecks,
  Flag,
  Activity,
  TrendingUp,
  AlertTriangle as AlertTriangleIcon, // Renamed to avoid conflict
  Clock,
  CheckCircle2,
  ChevronLeft,
  Edit3,
  BarChart3,
  GanttChartSquare,
  PieChartIcon,
  Loader2,
  ShieldAlert, // For Risk Assessment title
  Lightbulb, // For Mitigation Recommendations
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ProjectTimelineGantt } from '@/components/project-timeline-gantt';
import { ProjectBudgetChart } from '@/components/project-budget-chart';
import { ProjectEditForm } from '@/components/project-edit-form';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, useCallback } from 'react';

const statusIcons: Record<ProjectStatus, React.ElementType> = {
  'On Track': TrendingUp,
  'At Risk': AlertTriangleIcon,
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
  'Blocked': AlertTriangleIcon,
};

interface ClientCalculatedMetrics {
  daysRemaining: number;
  timelineProgress: number;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const { toast } = useToast();

  const [project, setProject] = useState<Project | undefined>(undefined);
  const [clientCalculatedMetrics, setClientCalculatedMetrics] = useState<ClientCalculatedMetrics | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    const foundProject = mockProjects.find((p) => p.id === projectId);
    setProject(foundProject);
  }, [projectId]);
  

  useEffect(() => {
    if (project) {
      const now = new Date();
      const endDate = parseISO(project.endDate);
      const startDate = parseISO(project.startDate);

      const daysRemainingCalculated = differenceInDays(endDate, now);
      const totalProjectDuration = differenceInDays(endDate, startDate);
      const daysPassed = Math.max(0, differenceInDays(now, startDate));
      const timelineProgressCalculated = totalProjectDuration > 0 ? Math.min(100, Math.max(0, (daysPassed / totalProjectDuration) * 100)) : 0;
      
      setClientCalculatedMetrics({
        daysRemaining: daysRemainingCalculated,
        timelineProgress: timelineProgressCalculated,
      });
    } else {
      setClientCalculatedMetrics(null);
    }
  }, [project]);


  const handleProjectSave = useCallback((updatedProjectData: Project) => {
    updateMockProject(updatedProjectData);
    setProject(updatedProjectData); // Update local state to re-render the page with new risk data
    setIsEditDialogOpen(false);
    // Toast is now handled in ProjectEditForm after AI assessment
  }, []);

  const getRiskScoreColor = (score: number) => {
    if (score <= 33) return 'bg-green-500'; // Low risk
    if (score <= 66) return 'bg-yellow-500'; // Medium risk
    return 'bg-red-500'; // High risk
  };


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
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Edit3 className="mr-2 h-4 w-4" /> Edit Project & Re-assess Risk
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Project: {project.name}</DialogTitle>
              <DialogDescription>
                Make changes to the project details. Saving will also trigger an AI risk re-assessment.
              </DialogDescription>
            </DialogHeader>
            <ProjectEditForm
              project={project}
              onSubmit={handleProjectSave}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card className="mb-8 shadow-xl">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <CardTitle className="text-2xl sm:text-3xl font-bold text-primary mb-2 sm:mb-0">{project.name}</CardTitle>
            <Badge className={cn('text-sm font-semibold px-3 py-1 shrink-0', statusColors[project.status])}>
              <StatusIcon className="mr-2 h-5 w-5" />
              {project.status}
            </Badge>
          </div>
          <CardDescription className="text-md pt-2">{project.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="mb-1 flex justify-between text-xs text-muted-foreground">
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
             <div className="flex items-start space-x-3 p-3 bg-secondary/30 rounded-md col-span-1 md:col-span-2 lg:col-span-1"> {/* Adjust span for layout */}
              <ListChecks className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Overall Status</p>
                <p className="text-muted-foreground">{project.status}</p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground pt-4 border-t">
          Last updated: {formatDate(project.lastUpdated)}
        </CardFooter>
      </Card>

      {project.riskAssessment && (
        <Card className="mb-8 shadow-xl">
          <CardHeader>
            <div className="flex items-center">
              <ShieldAlert className="h-6 w-6 mr-3 text-primary" />
              <CardTitle>AI Risk Assessment Overview</CardTitle>
            </div>
            <CardDescription>Summary of the latest AI-powered risk analysis for this project.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center">
                <ShieldAlert className="h-5 w-5 mr-2 text-accent" />
                Overall Risk Score: {project.riskAssessment.overallRiskScore} / 100
              </h3>
              <Progress
                value={project.riskAssessment.overallRiskScore}
                className="h-3"
                indicatorClassName={getRiskScoreColor(project.riskAssessment.overallRiskScore)}
                aria-label={`Overall risk score: ${project.riskAssessment.overallRiskScore} out of 100`}
              />
              <p className="text-sm text-muted-foreground mt-1">
                {project.riskAssessment.overallRiskScore <= 33 ? "Low Risk" : project.riskAssessment.overallRiskScore <= 66 ? "Medium Risk" : "High Risk"}
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center">
                <ListChecks className="h-5 w-5 mr-2 text-accent" />
                Identified Risks
              </h3>
              {project.riskAssessment.identifiedRisks.length > 0 ? (
                <ul className="list-disc list-inside space-y-1 pl-4 bg-secondary/30 p-4 rounded-md">
                  {project.riskAssessment.identifiedRisks.map((risk, index) => (
                    <li key={`risk-${index}`} className="text-sm">{risk}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No specific risks identified by the AI.</p>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center">
                <Lightbulb className="h-5 w-5 mr-2 text-accent" />
                Mitigation Recommendations
              </h3>
              {project.riskAssessment.riskMitigationRecommendations.length > 0 ? (
                <ul className="list-disc list-inside space-y-1 pl-4 bg-secondary/30 p-4 rounded-md">
                  {project.riskAssessment.riskMitigationRecommendations.map((rec, index) => (
                    <li key={`rec-${index}`} className="text-sm">{rec}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No specific mitigation recommendations provided by the AI.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}


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
    </div>
  );
}

