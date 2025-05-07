
'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { mockProjects, updateMockProject, mockDocuments } from '@/lib/mock-data';
import type { Project, KeyMilestone, ProjectStatus } from '@/types/project';
import type { ProjectDocument } from '@/types/document';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  CalendarDays,
  Users,
  DollarSign,
  ListChecks,
  Flag,
  Activity,
  TrendingUp,
  AlertTriangle as AlertTriangleIcon,
  Clock,
  CheckCircle2,
  ChevronLeft,
  Edit3,
  GanttChartSquare,
  PieChartIcon,
  Loader2,
  ShieldAlert,
  Lightbulb,
  Paperclip,
  UploadCloud,
  MessageSquare,
  ArrowRight,
  UserCheck,
  FileType,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ProjectTimelineGantt } from '@/components/project-timeline-gantt';
import { ProjectBudgetChart } from '@/components/project-budget-chart';
import { ProjectEditForm } from '@/components/project-edit-form';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


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
  'Delayed': 'bg-yellow-500 text-black',
  'Completed': 'bg-blue-500 text-white',
  'Planning': 'bg-gray-500 text-white',
};

const priorityColors: Record<Project['priority'], string> = {
  High: 'border-red-600 text-red-700 dark:text-red-500 bg-red-50 dark:bg-red-900/30',
  Medium: 'border-yellow-600 text-yellow-700 dark:text-yellow-500 bg-yellow-50 dark:bg-yellow-900/30',
  Low: 'border-green-600 text-green-700 dark:text-green-500 bg-green-50 dark:bg-green-900/30',
};

const milestoneStatusColors: Record<KeyMilestone['status'], string> = {
  'Pending': 'bg-gray-400 dark:bg-gray-600',
  'In Progress': 'bg-blue-500 dark:bg-blue-600',
  'Completed': 'bg-green-500 dark:bg-green-600',
  'Blocked': 'bg-red-500 dark:bg-red-600',
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
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [clientCalculatedMetrics, setClientCalculatedMetrics] = useState<ClientCalculatedMetrics | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    const foundProject = mockProjects.find((p) => p.id === projectId);
    setProject(foundProject);
    if (foundProject) {
      const projectDocs = mockDocuments.filter(doc => doc.projectId === projectId);
      setDocuments(projectDocs);
    }
  }, [projectId]);


  useEffect(() => {
    if (project) {
      const now = new Date();
      const endDate = parseISO(project.endDate);
      const startDate = parseISO(project.startDate);

      const daysRemainingCalculated = differenceInDays(endDate, now);
      const totalProjectDuration = differenceInDays(endDate, startDate);
      const daysPassed = Math.max(0, differenceInDays(now, startDate));

      let timelineProgressCalculated = 0;
      if (project.status === 'Completed') {
          timelineProgressCalculated = 100;
      } else if (totalProjectDuration > 0) {
           timelineProgressCalculated = Math.min(100, Math.max(0, (daysPassed / totalProjectDuration) * 100));
      }

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
    setProject(updatedProjectData);
    setIsEditDialogOpen(false);
  }, []);

  const getRiskScoreColor = (score: number) => {
    if (score <= 33) return 'bg-green-500';
    if (score <= 66) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const handleFileUpload = () => {
    // Placeholder for actual file upload logic
    toast({
      title: "File Upload (Demo)",
      description: "File upload functionality is not implemented in this demo.",
      variant: "default"
    });
  };


  if (!project) {
    return (
      <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8 text-center">
        <AlertTriangleIcon className="mx-auto h-16 w-16 text-destructive mb-6" />
        <h1 className="text-3xl font-semibold mb-4">Project Not Found</h1>
        <p className="text-muted-foreground mb-8 text-lg">
          The project you are looking for does not exist or could not be loaded.
        </p>
        <Button onClick={() => router.push('/')} size="lg">
          <ChevronLeft className="mr-2 h-5 w-5" /> Back to Dashboard
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
      <div className="flex items-center justify-between mb-8">
        <Button variant="outline" onClick={() => router.back()} size="sm">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/projects/${projectId}/discussions`}>
              <MessageSquare className="mr-2 h-4 w-4" /> Discussions
            </Link>
          </Button>
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="default" size="sm">
                <Edit3 className="mr-2 h-4 w-4" /> Edit & Re-assess Risk
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl md:max-w-4xl max-h-[90vh] overflow-y-auto p-6">
              <DialogHeader className="mb-4">
                <DialogTitle className="text-2xl">Edit Project: {project.name}</DialogTitle>
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
      </div>

      <Card className="mb-8 shadow-lg">
        <CardHeader className="pb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <CardTitle className="text-3xl font-bold text-primary">{project.name}</CardTitle>
            <Badge className={cn('text-base font-semibold px-4 py-2 shrink-0', statusColors[project.status])}>
              <StatusIcon className="mr-2 h-5 w-5" />
              {project.status}
            </Badge>
          </div>
          <CardDescription className="text-md pt-3">{project.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <div className="mb-1.5 flex justify-between text-sm text-muted-foreground">
                <span>Task Completion</span>
                <span className="font-medium text-foreground">{project.completionPercentage}%</span>
              </div>
              <Progress value={project.completionPercentage} aria-label={`${project.completionPercentage}% complete`} className="h-3" />
            </div>
            <div>
              <div className="mb-1.5 flex justify-between text-sm text-muted-foreground">
                <span>Timeline Progress</span>
                {clientCalculatedMetrics ? (
                  <span className={cn("font-medium", clientCalculatedMetrics.daysRemaining < 0 && project.status !== 'Completed' ? "text-destructive" : "text-foreground")}>
                    {clientCalculatedMetrics.daysRemaining >=0 ? `${clientCalculatedMetrics.daysRemaining} days remaining` : `${Math.abs(clientCalculatedMetrics.daysRemaining)} days overdue`}
                  </span>
                ) : (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              {clientCalculatedMetrics ? (
                <Progress value={clientCalculatedMetrics.timelineProgress} aria-label={`Timeline ${clientCalculatedMetrics.timelineProgress}% complete`} className="h-3" indicatorClassName={clientCalculatedMetrics.daysRemaining < 0 && project.status !== 'Completed' ? 'bg-destructive' : ''} />
              ) : (
                <Progress value={0} aria-label="Loading timeline progress" className="h-3" />
              )}
            </div>
          </div>
          
          {project.assignedUsers && project.assignedUsers.length > 0 && (
            <div className="p-4 bg-secondary/40 rounded-lg shadow-sm">
               <h3 className="text-lg font-semibold mb-3 flex items-center">
                <Users className="h-5 w-5 mr-2 text-accent" />
                Assigned Team
              </h3>
              <div className="flex flex-wrap gap-3">
                {project.assignedUsers.map(username => (
                  <TooltipProvider key={username}>
                    <Tooltip>
                      <TooltipTrigger>
                        <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                          <AvatarImage src={`https://picsum.photos/seed/${username.replace(/\s+/g, '')}/100`} alt={username} data-ai-hint="user avatar"/>
                          <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                            {username.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{username}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>
          )}


          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
            {[
              { icon: CalendarDays, label: "Timeline", content: `Start: ${formatDate(project.startDate)} | End: ${formatDate(project.endDate)}` },
              { icon: UserCheck, label: "Lead & Portfolio", content: `Lead: ${project.teamLead} | Portfolio: ${project.portfolio}` },
              { icon: DollarSign, label: "Financials", content: `Budget: $${project.budget.toLocaleString()} | Spent: $${project.spent.toLocaleString()}`, subContent: project.spent > project.budget ? `Over budget by $${(project.spent - project.budget).toLocaleString()}` : `Remaining: $${(project.budget - project.spent).toLocaleString()}`, subContentColor: project.spent > project.budget ? "text-destructive" : "text-green-600 dark:text-green-400" },
              { icon: Flag, label: "Priority", contentComponent: <Badge variant="outline" className={cn("text-sm px-2.5 py-1", priorityColors[project.priority])}>{project.priority}</Badge> },
              { icon: ListChecks, label: "Overall Status", content: project.status, className: "md:col-span-2 lg:col-span-1" },
            ].map((item, idx) => (
              <div key={idx} className={cn("flex items-start space-x-3 p-4 bg-secondary/40 rounded-lg shadow-sm", item.className)}>
                <item.icon className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">{item.label}</p>
                  {item.content && <p className="text-muted-foreground">{item.content}</p>}
                  {item.contentComponent}
                  {item.subContent && <p className={cn("text-xs mt-0.5", item.subContentColor)}>{item.subContent}</p>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground pt-4 border-t">
          Last updated: {formatDate(project.lastUpdated)}
        </CardFooter>
      </Card>

      {project.riskAssessment && (
        <Card className="mb-8 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center">
              <ShieldAlert className="h-7 w-7 mr-3 text-primary" />
              <CardTitle className="text-2xl">AI Risk Assessment</CardTitle>
            </div>
            <CardDescription>Summary of the latest AI-powered risk analysis for this project.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-2">
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center">
                <Activity className="h-5 w-5 mr-2 text-accent" />
                Overall Risk Score:
                <span className={cn("ml-2 px-2 py-0.5 rounded text-sm text-white", getRiskScoreColor(project.riskAssessment.overallRiskScore))}>
                   {project.riskAssessment.overallRiskScore} / 100
                </span>
              </h3>
              <Progress
                value={project.riskAssessment.overallRiskScore}
                className="h-3"
                indicatorClassName={getRiskScoreColor(project.riskAssessment.overallRiskScore)}
                aria-label={`Overall risk score: ${project.riskAssessment.overallRiskScore} out of 100`}
              />
              <p className="text-sm text-muted-foreground mt-1.5">
                Interpretation: {project.riskAssessment.overallRiskScore <= 33 ? "Low Risk" : project.riskAssessment.overallRiskScore <= 66 ? "Medium Risk" : "High Risk"}
              </p>
            </div>

            <div className="p-4 bg-secondary/40 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-2 flex items-center">
                <ListChecks className="h-5 w-5 mr-2 text-accent" />
                Identified Risks
              </h3>
              {project.riskAssessment.identifiedRisks.length > 0 ? (
                <ul className="list-disc list-inside space-y-1.5 pl-2">
                  {project.riskAssessment.identifiedRisks.map((risk, index) => (
                    <li key={`risk-${index}`} className="text-sm text-foreground">{risk}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No specific risks identified by the AI.</p>
              )}
            </div>

            <div className="p-4 bg-secondary/40 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-2 flex items-center">
                <Lightbulb className="h-5 w-5 mr-2 text-accent" />
                Mitigation Recommendations
              </h3>
              {project.riskAssessment.riskMitigationRecommendations.length > 0 ? (
                <ul className="list-disc list-inside space-y-1.5 pl-2">
                  {project.riskAssessment.riskMitigationRecommendations.map((rec, index) => (
                    <li key={`rec-${index}`} className="text-sm text-foreground">{rec}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No specific mitigation recommendations provided by the AI.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}


      <Card className="mb-8 shadow-lg">
        <CardHeader className="pb-4">
            <div className="flex items-center">
                 <ListChecks className="h-7 w-7 mr-3 text-primary" />
                <CardTitle className="text-2xl">Key Milestones</CardTitle>
            </div>
          <CardDescription>Track the progress of important project milestones.</CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          {project.keyMilestones.length > 0 ? (
            <ul className="space-y-4">
              {project.keyMilestones.map((milestone) => {
                const MilestoneStatusIcon = milestoneStatusIcons[milestone.status];
                return (
                  <li key={milestone.id} className="flex items-start sm:items-center space-x-4 p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow bg-secondary/20">
                     <Badge
                      className={cn(
                        'px-2.5 py-1 text-xs font-semibold text-white shrink-0 flex items-center gap-1.5',
                        milestoneStatusColors[milestone.status]
                      )}
                      aria-label={`Milestone status: ${milestone.status}`}
                    >
                      <MilestoneStatusIcon className="h-3.5 w-3.5" />
                       <span>{milestone.status}</span>
                    </Badge>
                    <div className="flex-grow">
                      <p className="font-semibold text-foreground">{milestone.name}</p>
                      <p className="text-sm text-muted-foreground">Target Date: {formatDate(milestone.date)}</p>
                    </div>
                    {milestone.assignedTo && (
                       <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Avatar className="h-8 w-8 border-2 border-background shadow-sm shrink-0">
                              <AvatarImage src={`https://picsum.photos/seed/${milestone.assignedTo.replace(/\s+/g, '')}/80`} alt={milestone.assignedTo} data-ai-hint="user avatar" />
                              <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                                {milestone.assignedTo.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Assigned to: {milestone.assignedTo}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-muted-foreground text-center py-6">No key milestones defined for this project.</p>
          )}
        </CardContent>
      </Card>

      <Card className="mb-8 shadow-lg">
        <CardHeader className="pb-4 flex flex-col sm:flex-row justify-between items-center">
          <div>
            <div className="flex items-center">
              <Paperclip className="h-7 w-7 mr-3 text-primary" />
              <CardTitle className="text-2xl">Project Documents</CardTitle>
            </div>
            <CardDescription>Shared files and documentation for this project.</CardDescription>
          </div>
          <Button onClick={handleFileUpload} variant="outline" size="sm">
            <UploadCloud className="mr-2 h-4 w-4" /> Upload Document
          </Button>
        </CardHeader>
        <CardContent className="pt-2">
          {documents.length > 0 ? (
            <ul className="space-y-3">
              {documents.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between p-3 border rounded-lg shadow-sm hover:bg-muted/30 transition-colors">
                  <div className="flex items-center space-x-3">
                    <FileType className="h-6 w-6 text-accent" />
                    <div>
                      <a href={doc.url} download={doc.name} className="font-medium text-foreground hover:underline hover:text-primary transition-colors">{doc.name}</a>
                      <p className="text-xs text-muted-foreground">
                        {doc.type} - {doc.size} - Uploaded by {doc.uploadedBy} on {formatDate(doc.uploadedAt)}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" asChild className="text-muted-foreground hover:text-primary">
                    <a href={doc.url} download={doc.name} title={`Download ${doc.name}`}>
                      <DownloadCloud className="h-5 w-5" />
                    </a>
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-center py-6">No documents uploaded for this project yet.</p>
          )}
        </CardContent>
      </Card>


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
         <Card className="shadow-lg">
            <CardHeader className="pb-4">
                <div className="flex items-center">
                    <GanttChartSquare className="h-7 w-7 mr-3 text-primary" />
                    <CardTitle className="text-2xl">Project Timeline</CardTitle>
                </div>
                <CardDescription>Visual representation of the project schedule.</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
                <ProjectTimelineGantt projects={[project]} />
            </CardContent>
        </Card>
        <Card className="shadow-lg">
            <CardHeader className="pb-4">
                <div className="flex items-center">
                    <PieChartIcon className="h-7 w-7 mr-3 text-primary" />
                    <CardTitle className="text-2xl">Budget Overview</CardTitle>
                </div>
                <CardDescription>Budget allocation and spending for this project.</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
                <ProjectBudgetChart projects={[project]} />
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Added DownloadCloud icon
const DownloadCloud = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
    <path d="M12 12v9" />
    <path d="m8 17 4 4 4-4" />
  </svg>
);
