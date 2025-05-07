
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
  Banknote, // Added Banknote icon
  DownloadCloud, // Added DownloadCloud icon
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

// Use status styles from report definitions for consistency
import { statusStyles as reportStatusStyles, priorityColors as reportPriorityColors } from '@/app/reports/report-style-definitions';

const statusIcons: Record<ProjectStatus, React.ElementType> = {
  'On Track': TrendingUp,
  'At Risk': AlertTriangleIcon,
  'Delayed': Clock,
  'Completed': CheckCircle2,
  'Planning': Activity,
};

// Merge report styles with specific styles if needed, or just use report styles
const statusStyles = reportStatusStyles;
const priorityColors = reportPriorityColors;


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
      } else {
        // Handle cases where start and end date might be the same or invalid
        timelineProgressCalculated = project.completionPercentage; // Fallback to task completion
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
    // Re-calculate metrics after saving
    const now = new Date();
    const endDate = parseISO(updatedProjectData.endDate);
    const startDate = parseISO(updatedProjectData.startDate);
    const daysRemainingCalculated = differenceInDays(endDate, now);
    const totalProjectDuration = differenceInDays(endDate, startDate);
    const daysPassed = Math.max(0, differenceInDays(now, startDate));
    let timelineProgressCalculated = 0;
    if (updatedProjectData.status === 'Completed') {
        timelineProgressCalculated = 100;
    } else if (totalProjectDuration > 0) {
         timelineProgressCalculated = Math.min(100, Math.max(0, (daysPassed / totalProjectDuration) * 100));
    } else {
      timelineProgressCalculated = updatedProjectData.completionPercentage;
    }
     setClientCalculatedMetrics({
        daysRemaining: daysRemainingCalculated,
        timelineProgress: timelineProgressCalculated,
      });
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
  const currentStatusStyles = statusStyles[project.status] || statusStyles['Planning']; // Use imported styles

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM dd, yyyy');
    } catch (error) {
      return 'N/A';
    }
  };

  // Define TimelineProgressContent and TimelineProgressIndicator conditionally
  let TimelineProgressContent: React.ReactNode;
  let TimelineProgressIndicator: React.ReactNode;
  if (!clientCalculatedMetrics) {
    TimelineProgressContent = <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />;
    TimelineProgressIndicator = <Progress value={0} aria-label="Loading timeline progress" className="h-2" />;
  } else {
      const { daysRemaining, timelineProgress } = clientCalculatedMetrics;
      TimelineProgressContent = (
         <span className={cn("font-medium", daysRemaining < 0 && project.status !== 'Completed' ? "text-destructive" : "text-foreground")}>
            {daysRemaining >=0 ? `${daysRemaining} days remaining` : `${Math.abs(daysRemaining)} days overdue`}
        </span>
      );
      TimelineProgressIndicator = (
          <Progress value={timelineProgress} aria-label={`Timeline ${timelineProgress}% complete`} className="h-2" indicatorClassName={daysRemaining < 0 && project.status !== 'Completed' ? 'bg-destructive' : currentStatusStyles.progress} />
      );
  }

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6"> {/* Reduced margin */}
        <Button variant="outline" onClick={() => router.back()} size="sm" className="h-9 text-xs"> {/* Adjusted size */}
          <ChevronLeft className="mr-1.5 h-4 w-4" /> {/* Adjusted size */}
          Back
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild className="h-9 text-xs">
            <Link href={`/projects/${projectId}/discussions`}>
              <MessageSquare className="mr-1.5 h-4 w-4" /> Discussions
            </Link>
          </Button>
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="default" size="sm" className="h-9 text-xs">
                <Edit3 className="mr-1.5 h-4 w-4" /> Edit & Re-assess Risk
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl md:max-w-4xl max-h-[90vh] overflow-y-auto p-6">
              <DialogHeader className="mb-4">
                <DialogTitle className="text-xl">Edit Project: {project.name}</DialogTitle> {/* Adjusted size */}
                <DialogDescription className="text-xs"> {/* Adjusted size */}
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

      <Card className="mb-6 shadow-lg"> {/* Reduced margin */}
        <CardHeader className="pb-4 pt-5 px-5"> {/* Adjusted padding */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <CardTitle className="text-2xl font-semibold text-primary">{project.name}</CardTitle> {/* Adjusted size */}
            <Badge className={cn('text-sm font-semibold px-3 py-1 shrink-0', currentStatusStyles.badge)} variant="outline"> {/* Use consistent badge style */}
              <StatusIcon className="mr-1.5 h-4 w-4" /> {/* Adjusted size */}
              {project.status}
            </Badge>
          </div>
          <CardDescription className="text-sm pt-2">{project.description}</CardDescription> {/* Adjusted size */}
        </CardHeader>
        <CardContent className="space-y-5 px-5"> {/* Adjusted spacing and padding */}
          <div className="space-y-3"> {/* Reduced spacing */}
            <div>
              <div className="mb-1 flex justify-between text-xs text-muted-foreground"> {/* Adjusted size */}
                <span>Task Completion</span>
                <span className="font-medium text-foreground">{project.completionPercentage}%</span>
              </div>
              <Progress value={project.completionPercentage} aria-label={`${project.completionPercentage}% complete`} className="h-2" indicatorClassName={currentStatusStyles.progress}/> {/* Adjusted height */}
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                <span>Timeline Progress</span>
                {TimelineProgressContent}
              </div>
              {TimelineProgressIndicator}
            </div>
          </div>

          {project.assignedUsers && project.assignedUsers.length > 0 && (
            <div className="p-3 bg-secondary/40 rounded-lg shadow-xs"> {/* Reduced padding */}
               <h3 className="text-sm font-semibold mb-2 flex items-center"> {/* Adjusted size */}
                <Users className="h-4 w-4 mr-1.5 text-accent" /> {/* Adjusted size */}
                Assigned Team
              </h3>
              <div className="flex flex-wrap gap-2"> {/* Reduced gap */}
                {project.assignedUsers.map(username => (
                  <TooltipProvider key={username}>
                    <Tooltip>
                      <TooltipTrigger>
                        <Avatar className="h-8 w-8 border-2 border-background shadow-sm"> {/* Smaller avatar */}
                          <AvatarImage src={`https://picsum.photos/seed/${username.replace(/\s+/g, '')}/80`} alt={username} data-ai-hint="user avatar"/>
                          <AvatarFallback className="text-[10px] bg-primary text-primary-foreground"> {/* Smaller fallback */}
                            {username.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">{username}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>
          )}


          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs"> {/* Reduced gap and text size */}
            {[
              { icon: CalendarDays, label: "Timeline", content: `Start: ${formatDate(project.startDate)} | End: ${formatDate(project.endDate)}` },
              { icon: UserCheck, label: "Lead & Portfolio", content: `Lead: ${project.teamLead} | Portfolio: ${project.portfolio}` },
              { icon: DollarSign, label: "Financials", content: `Budget: $${project.budget.toLocaleString()} | Spent: $${project.spent.toLocaleString()}`, subContent: project.spent > project.budget ? `Over budget by $${(project.spent - project.budget).toLocaleString()}` : `Remaining: $${(project.budget - project.spent).toLocaleString()}`, subContentColor: project.spent > project.budget ? "text-destructive" : "text-green-600 dark:text-green-400" },
              { icon: Flag, label: "Priority", contentComponent: <Badge variant="outline" className={cn("text-xs px-2 py-0.5", priorityColors[project.priority])}>{project.priority}</Badge> }, // Adjusted padding/size
              { icon: ListChecks, label: "Overall Status", contentComponent: <Badge variant="outline" className={cn('text-xs font-semibold px-2 py-0.5', currentStatusStyles.badge)}><StatusIcon className="mr-1 h-3 w-3" />{project.status}</Badge>, className: "md:col-span-2 lg:col-span-1" }, // Use badge for status
            ].map((item, idx) => (
              <div key={idx} className={cn("flex items-start space-x-2.5 p-3 bg-secondary/40 rounded-lg shadow-xs", item.className)}> {/* Reduced padding/spacing */}
                <item.icon className="h-4 w-4 text-accent flex-shrink-0 mt-px" /> {/* Adjusted size */}
                <div>
                  <p className="font-semibold text-foreground text-sm">{item.label}</p> {/* Adjusted size */}
                  {item.content && <p className="text-muted-foreground">{item.content}</p>}
                  {item.contentComponent}
                  {item.subContent && <p className={cn("text-xs mt-0.5", item.subContentColor)}>{item.subContent}</p>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground pt-3 pb-4 px-5 border-t"> {/* Adjusted padding */}
          Last updated: {formatDate(project.lastUpdated)}
        </CardFooter>
      </Card>

      {project.riskAssessment && (
        <Card className="mb-6 shadow-lg"> {/* Consistent margin */}
          <CardHeader className="pb-3 pt-4 px-5"> {/* Consistent padding */}
            <div className="flex items-center">
              <ShieldAlert className="h-6 w-6 mr-2 text-primary" /> {/* Adjusted size */}
              <CardTitle className="text-xl">AI Risk Assessment</CardTitle> {/* Adjusted size */}
            </div>
            <CardDescription className="text-xs">Summary of the latest AI-powered risk analysis for this project.</CardDescription> {/* Adjusted size */}
          </CardHeader>
          <CardContent className="space-y-4 pt-2 px-5 pb-5"> {/* Adjusted spacing/padding */}
            <div>
              <h3 className="text-sm font-semibold mb-1.5 flex items-center"> {/* Adjusted size */}
                <Activity className="h-4 w-4 mr-1.5 text-accent" /> {/* Adjusted size */}
                Overall Risk Score:
                <span className={cn("ml-1.5 px-1.5 py-0.5 rounded text-[11px] text-white", getRiskScoreColor(project.riskAssessment.overallRiskScore))}> {/* Adjusted size */}
                   {project.riskAssessment.overallRiskScore} / 100
                </span>
              </h3>
              <Progress
                value={project.riskAssessment.overallRiskScore}
                className="h-2" // Adjusted height
                indicatorClassName={getRiskScoreColor(project.riskAssessment.overallRiskScore)}
                aria-label={`Overall risk score: ${project.riskAssessment.overallRiskScore} out of 100`}
              />
              <p className="text-xs text-muted-foreground mt-1"> {/* Adjusted size */}
                Interpretation: {project.riskAssessment.overallRiskScore <= 33 ? "Low Risk" : project.riskAssessment.overallRiskScore <= 66 ? "Medium Risk" : "High Risk"}
              </p>
            </div>

            <div className="p-3 bg-secondary/40 rounded-lg shadow-xs"> {/* Reduced padding */}
              <h3 className="text-sm font-semibold mb-1.5 flex items-center"> {/* Adjusted size */}
                <ListChecks className="h-4 w-4 mr-1.5 text-accent" />
                Identified Risks
              </h3>
              {project.riskAssessment.identifiedRisks.length > 0 ? (
                <ul className="list-disc list-inside space-y-1 pl-1"> {/* Reduced spacing */}
                  {project.riskAssessment.identifiedRisks.map((risk, index) => (
                    <li key={`risk-${index}`} className="text-xs text-foreground">{risk}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">No specific risks identified by the AI.</p>
              )}
            </div>

            <div className="p-3 bg-secondary/40 rounded-lg shadow-xs">
              <h3 className="text-sm font-semibold mb-1.5 flex items-center">
                <Lightbulb className="h-4 w-4 mr-1.5 text-accent" />
                Mitigation Recommendations
              </h3>
              {project.riskAssessment.riskMitigationRecommendations.length > 0 ? (
                <ul className="list-disc list-inside space-y-1 pl-1">
                  {project.riskAssessment.riskMitigationRecommendations.map((rec, index) => (
                    <li key={`rec-${index}`} className="text-xs text-foreground">{rec}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">No specific mitigation recommendations provided by the AI.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6 shadow-lg">
        <CardHeader className="pb-3 pt-4 px-5">
            <div className="flex items-center">
              <Banknote className="h-6 w-6 mr-2 text-primary" />
              <CardTitle className="text-xl">Financial Health</CardTitle>
            </div>
            <CardDescription className="text-xs">Overview of the project&apos;s budget and expenditure.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-2 px-5 pb-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3"> {/* Reduced gap */}
              <div className="p-3 bg-secondary/40 rounded-lg shadow-xs text-center md:text-left"> {/* Reduced padding */}
                <p className="text-xs text-muted-foreground">Total Budget</p>
                <p className="text-xl font-semibold text-foreground">${project.budget.toLocaleString()}</p> {/* Adjusted size */}
              </div>
              <div className="p-3 bg-secondary/40 rounded-lg shadow-xs text-center md:text-left">
                <p className="text-xs text-muted-foreground">Amount Spent</p>
                <p className="text-xl font-semibold text-foreground">${project.spent.toLocaleString()}</p>
              </div>
              <div className={cn(
                  "p-3 rounded-lg shadow-xs text-center md:text-left",
                  project.budget - project.spent < 0 ? 'bg-red-100 dark:bg-red-900/30' : 'bg-green-100 dark:bg-green-900/30'
                )}>
                <p className={cn(
                    "text-xs",
                    project.budget - project.spent < 0 ? 'text-red-700 dark:text-red-300' : 'text-green-700 dark:text-green-300'
                  )}>
                  {project.budget - project.spent >= 0 ? 'Remaining Budget' : 'Budget Deficit'}
                </p>
                <p className={cn(
                    "text-xl font-semibold",
                     project.budget - project.spent < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                  )}>
                  ${Math.abs(project.budget - project.spent).toLocaleString()}
                </p>
              </div>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                <span>Budget Utilization</span>
                <span className="font-medium text-foreground">
                  {project.budget > 0 ? ((project.spent / project.budget) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <Progress
                value={project.budget > 0 ? (project.spent / project.budget) * 100 : 0}
                className="h-2" // Adjusted height
                indicatorClassName={project.spent > project.budget ? 'bg-destructive' : ((project.spent / project.budget) * 100) > 85 ? 'bg-yellow-500' : 'bg-primary'}
                aria-label="Budget utilization"
              />
              {project.spent > project.budget && project.budget > 0 && (
                <p className="text-xs text-destructive mt-1">
                  Over budget by {(((project.spent - project.budget) / project.budget) * 100).toFixed(1)}%
                  (${(project.spent - project.budget).toLocaleString()})
                </p>
              )}
            </div>
          </CardContent>
      </Card>


      <Card className="mb-6 shadow-lg">
        <CardHeader className="pb-3 pt-4 px-5">
            <div className="flex items-center">
                 <ListChecks className="h-6 w-6 mr-2 text-primary" />
                <CardTitle className="text-xl">Key Milestones</CardTitle>
            </div>
          <CardDescription className="text-xs">Track the progress of important project milestones.</CardDescription>
        </CardHeader>
        <CardContent className="pt-2 px-5 pb-5">
          {project.keyMilestones.length > 0 ? (
            <ul className="space-y-3"> {/* Reduced spacing */}
              {project.keyMilestones.map((milestone) => {
                const MilestoneStatusIcon = milestoneStatusIcons[milestone.status];
                return (
                  <li key={milestone.id} className="flex items-center space-x-3 p-3 border rounded-lg shadow-xs bg-secondary/20 hover:bg-muted/30 transition-colors"> {/* Reduced padding */}
                     <Badge
                      variant="outline" // Changed variant
                      className={cn(
                        'px-2 py-0.5 text-xs font-medium flex items-center gap-1 border', // Adjusted padding/size
                        milestoneStatusColors[milestone.status] // Apply status colors
                      )}
                      aria-label={`Milestone status: ${milestone.status}`}
                    >
                      <MilestoneStatusIcon className="h-3 w-3" /> {/* Adjusted size */}
                       <span className="ml-1">{milestone.status}</span>
                    </Badge>
                    <div className="flex-grow">
                      <p className="font-medium text-sm text-foreground">{milestone.name}</p> {/* Adjusted size */}
                      <p className="text-xs text-muted-foreground">Target: {formatDate(milestone.date)}</p>
                    </div>
                    {milestone.assignedTo && (
                       <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Avatar className="h-7 w-7 border border-background shadow-sm shrink-0"> {/* Adjusted size */}
                              <AvatarImage src={`https://picsum.photos/seed/${milestone.assignedTo.replace(/\s+/g, '')}/60`} alt={milestone.assignedTo} data-ai-hint="user avatar" />
                              <AvatarFallback className="text-[10px] bg-primary text-primary-foreground"> {/* Smaller fallback */}
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
            <p className="text-muted-foreground text-center py-5 text-sm">No key milestones defined for this project.</p> {/* Adjusted padding/size */}
          )}
        </CardContent>
      </Card>

      <Card className="mb-6 shadow-lg">
        <CardHeader className="pb-3 pt-4 px-5 flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <div className="flex items-center">
              <Paperclip className="h-6 w-6 mr-2 text-primary" />
              <CardTitle className="text-xl">Project Documents</CardTitle>
            </div>
            <CardDescription className="text-xs mt-1">Shared files and documentation for this project.</CardDescription>
          </div>
          <Button onClick={handleFileUpload} variant="outline" size="sm" className="h-9 text-xs mt-2 sm:mt-0"> {/* Adjusted size */}
            <UploadCloud className="mr-1.5 h-4 w-4" /> Upload Document {/* Adjusted size */}
          </Button>
        </CardHeader>
        <CardContent className="pt-2 px-5 pb-5">
          {documents.length > 0 ? (
            <ul className="space-y-2.5"> {/* Reduced spacing */}
              {documents.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between p-2.5 border rounded-lg shadow-xs hover:bg-muted/30 transition-colors"> {/* Reduced padding */}
                  <div className="flex items-center space-x-2.5 overflow-hidden"> {/* Added overflow-hidden */}
                    <FileType className="h-5 w-5 text-accent flex-shrink-0" /> {/* Adjusted size */}
                    <div className="overflow-hidden"> {/* Added overflow-hidden */}
                      <a href={doc.url} download={doc.name} className="font-medium text-sm text-foreground hover:underline hover:text-primary transition-colors truncate block">{doc.name}</a> {/* Truncate */}
                      <p className="text-xs text-muted-foreground truncate"> {/* Truncate */}
                        {doc.type} - {doc.size} - Uploaded by {doc.uploadedBy} on {formatDate(doc.uploadedAt)}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" asChild className="text-muted-foreground hover:text-primary h-8 w-8"> {/* Adjusted size */}
                    <a href={doc.url} download={doc.name} title={`Download ${doc.name}`}>
                      <DownloadCloud className="h-4 w-4" /> {/* Adjusted size */}
                    </a>
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-center py-5 text-sm">No documents uploaded for this project yet.</p>
          )}
        </CardContent>
      </Card>


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6"> {/* Reduced gap/margin */}
         <Card className="shadow-lg">
            <CardHeader className="pb-3 pt-4 px-5">
                <div className="flex items-center">
                    <GanttChartSquare className="h-6 w-6 mr-2 text-primary" />
                    <CardTitle className="text-xl">Project Timeline</CardTitle>
                </div>
                <CardDescription className="text-xs">Visual representation of the project schedule.</CardDescription>
            </CardHeader>
            <CardContent className="pt-2 px-3 pb-4"> {/* Adjusted padding */}
                <ProjectTimelineGantt projects={[project]} />
            </CardContent>
        </Card>
        <Card className="shadow-lg">
            <CardHeader className="pb-3 pt-4 px-5">
                <div className="flex items-center">
                    <PieChartIcon className="h-6 w-6 mr-2 text-primary" />
                    <CardTitle className="text-xl">Budget Overview</CardTitle>
                </div>
                <CardDescription className="text-xs">Budget allocation and spending for this project.</CardDescription>
            </CardHeader>
             <CardContent className="pt-2 px-3 pb-4"> {/* Adjusted padding */}
                <ProjectBudgetChart projects={[project]} />
            </CardContent>
        </Card>
      </div>
    </div>
  );
}


// Kept DownloadCloud icon definition for clarity, even though not modified
// const DownloadCloud = (props: React.SVGProps<SVGSVGElement>) => ( ... );

