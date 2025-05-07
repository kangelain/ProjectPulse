
'use client';

import { useState, useEffect, useMemo } from 'react';
import { mockProjects } from '@/lib/mock-data';
import type { Project, ProjectStatus } from '@/types/project';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, parseISO, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { ListChecks, Briefcase, Users, TrendingUp, PieChart, UsersRound, AlertTriangle, Clock, CheckCircle2, Activity, Loader2, FileText } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


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

const statusIcons: Record<ProjectStatus, React.ElementType> = {
  'On Track': TrendingUp,
  'At Risk': AlertTriangle,
  'Delayed': Clock,
  'Completed': CheckCircle2,
  'Planning': Activity,
};

interface CalculatedProjectMetrics {
  daysRemaining: number;
  isOverdue: boolean;
  timelineProgress: number;
}

interface PortfolioSummary {
  portfolioName: string;
  totalProjects: number;
  averageCompletion: number;
  totalBudget: number;
  totalSpent: number;
  budgetVariance: number;
  statusCounts: Record<ProjectStatus, number>;
}

interface TeamLeadWorkload {
  teamLead: string;
  projectCount: number;
  projects: Array<{ id: string; name: string; status: ProjectStatus, priority: Project['priority'], completionPercentage: number }>;
}

export default function ReportsPage() {
  const [projectMetrics, setProjectMetrics] = useState<Record<string, CalculatedProjectMetrics | null>>({});
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);

  useEffect(() => {
    const metricsData: Record<string, CalculatedProjectMetrics | null> = {};
    const now = new Date();
    mockProjects.forEach(project => {
      try {
        const endDate = parseISO(project.endDate);
        const startDate = parseISO(project.startDate);

        const daysRemainingCalculated = differenceInDays(endDate, now);
        const isOverdueCalculated = daysRemainingCalculated < 0;

        const totalProjectDuration = differenceInDays(endDate, startDate);
        const daysPassed = Math.max(0, differenceInDays(now, startDate));
        
        let timelineProgressCalculated = 0;
        if (project.status === 'Completed') {
            timelineProgressCalculated = 100;
        } else if (totalProjectDuration > 0) {
            timelineProgressCalculated = Math.min(100, Math.max(0, (daysPassed / totalProjectDuration) * 100));
        }


        metricsData[project.id] = {
          daysRemaining: Math.abs(daysRemainingCalculated),
          isOverdue: isOverdueCalculated,
          timelineProgress: timelineProgressCalculated,
        };
      } catch (e) {
        console.error(`Error calculating metrics for project ${project.id}:`, e);
        metricsData[project.id] = null; // Handle potential date parsing errors
      }
    });
    setProjectMetrics(metricsData);
    setIsLoadingMetrics(false);
  }, []);

  const portfolioSummaries = useMemo<PortfolioSummary[]>(() => {
    const portfolios: Record<string, PortfolioSummary> = {};
    mockProjects.forEach(p => {
      if (!portfolios[p.portfolio]) {
        portfolios[p.portfolio] = {
          portfolioName: p.portfolio,
          totalProjects: 0,
          averageCompletion: 0,
          totalBudget: 0,
          totalSpent: 0,
          budgetVariance: 0,
          statusCounts: { 'On Track': 0, 'At Risk': 0, 'Delayed': 0, 'Completed': 0, 'Planning': 0 },
        };
      }
      const summary = portfolios[p.portfolio];
      summary.totalProjects++;
      summary.averageCompletion += p.completionPercentage;
      summary.totalBudget += p.budget;
      summary.totalSpent += p.spent;
      summary.statusCounts[p.status]++;
    });

    return Object.values(portfolios).map(s => ({
      ...s,
      averageCompletion: s.totalProjects > 0 ? parseFloat((s.averageCompletion / s.totalProjects).toFixed(2)) : 0,
      budgetVariance: s.totalBudget - s.totalSpent,
    }));
  }, []);

  const teamLeadWorkloads = useMemo<TeamLeadWorkload[]>(() => {
    const leads: Record<string, TeamLeadWorkload> = {};
    mockProjects.forEach(p => {
      if (!leads[p.teamLead]) {
        leads[p.teamLead] = {
          teamLead: p.teamLead,
          projectCount: 0,
          projects: [],
        };
      }
      leads[p.teamLead].projectCount++;
      leads[p.teamLead].projects.push({ id: p.id, name: p.name, status: p.status, priority: p.priority, completionPercentage: p.completionPercentage });
    });
    return Object.values(leads).sort((a,b) => b.projectCount - a.projectCount);
  }, []);

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM dd, yyyy');
    } catch (error) {
      return 'N/A';
    }
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  }


  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center mb-8">
        <FileText className="h-8 w-8 mr-3 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Project Reports</h1>
      </div>

      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 mb-6">
          <TabsTrigger value="performance">
            <ListChecks className="mr-2 h-4 w-4" /> Project Performance
          </TabsTrigger>
          <TabsTrigger value="portfolio">
            <Briefcase className="mr-2 h-4 w-4" /> Portfolio Summaries
          </TabsTrigger>
          <TabsTrigger value="resources">
            <UsersRound className="mr-2 h-4 w-4" /> Team Overview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="performance">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle>Project Performance Details</CardTitle>
              <CardDescription>Comprehensive overview of all projects, their status, and key metrics.</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] w-full">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead className="w-[200px]">Project Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead className="text-right">Completion %</TableHead>
                      <TableHead className="text-right">Budget</TableHead>
                      <TableHead className="text-right">Spent</TableHead>
                      <TableHead className="text-right">Variance</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Days Left/Overdue</TableHead>
                      <TableHead>Team Lead</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockProjects.map(project => {
                      const metrics = projectMetrics[project.id];
                      const StatusIcon = statusIcons[project.status];
                      return (
                        <TableRow key={project.id}>
                          <TableCell className="font-medium text-primary">{project.name}</TableCell>
                          <TableCell>
                            <Badge className={cn('text-xs', statusColors[project.status])}>
                              <StatusIcon className="mr-1.5 h-3 w-3" />
                              {project.status}
                            </Badge>
                          </TableCell>
                           <TableCell>
                            <Badge variant="outline" className={cn("text-xs", priorityColors[project.priority])}>
                              {project.priority}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end">
                                <span className="mr-2">{project.completionPercentage}%</span>
                                <Progress value={project.completionPercentage} className="h-2 w-16" aria-label={`${project.completionPercentage}% complete`} />
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(project.budget)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(project.spent)}</TableCell>
                          <TableCell className={cn("text-right", project.budget - project.spent >= 0 ? 'text-green-600' : 'text-red-600')}>
                            {formatCurrency(project.budget - project.spent)}
                          </TableCell>
                          <TableCell>{formatDate(project.startDate)}</TableCell>
                          <TableCell>{formatDate(project.endDate)}</TableCell>
                          <TableCell>
                            {isLoadingMetrics ? <Loader2 className="h-4 w-4 animate-spin"/> : metrics ? (
                              metrics.isOverdue ? 
                              <span className="text-red-600">{metrics.daysRemaining} days overdue</span> : 
                              <span>{metrics.daysRemaining} days left</span>
                            ) : 'N/A'}
                          </TableCell>
                          <TableCell>{project.teamLead}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="portfolio">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolioSummaries.map(summary => (
              <Card key={summary.portfolioName} className="shadow-xl flex flex-col">
                <CardHeader>
                  <CardTitle className="text-primary">{summary.portfolioName}</CardTitle>
                  <CardDescription>{summary.totalProjects} projects</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 flex-grow">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg. Completion</p>
                    <div className="flex items-center">
                      <Progress value={summary.averageCompletion} className="h-2 mr-2 flex-1" aria-label={`Average completion ${summary.averageCompletion}%`} />
                      <span className="text-sm font-semibold">{summary.averageCompletion}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Financials</p>
                    <p className="text-xs">Budget: {formatCurrency(summary.totalBudget)}</p>
                    <p className="text-xs">Spent: {formatCurrency(summary.totalSpent)}</p>
                    <p className={cn("text-xs font-semibold", summary.budgetVariance >=0 ? 'text-green-600' : 'text-red-600')}>
                      Variance: {formatCurrency(summary.budgetVariance)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Status Breakdown</p>
                    <div className="space-y-1">
                    {Object.entries(summary.statusCounts).map(([status, count]) =>
                      count > 0 ? (
                        <div key={status} className="flex justify-between items-center text-xs">
                           <Badge className={cn('text-xs py-0.5 px-1.5', statusColors[status as ProjectStatus])} variant="default">
                             {statusIcons[status as ProjectStatus] && React.createElement(statusIcons[status as ProjectStatus], {className: "h-3 w-3 mr-1"})}
                             {status}
                           </Badge>
                          <span>{count} project{count > 1 ? 's' : ''}</span>
                        </div>
                      ) : null
                    )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="resources">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle>Team Overview & Workload</CardTitle>
              <CardDescription>Breakdown of projects managed by each team lead.</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] w-full">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead className="w-[200px]">Team Lead</TableHead>
                      <TableHead className="text-center w-[120px]">Project Count</TableHead>
                      <TableHead>Active Projects (Status & Priority)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamLeadWorkloads.map(lead => (
                      <TableRow key={lead.teamLead}>
                        <TableCell className="font-medium">{lead.teamLead}</TableCell>
                        <TableCell className="text-center">{lead.projectCount}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            {lead.projects.filter(p => p.status !== 'Completed').map(p => (
                               <TooltipProvider key={p.id} delayDuration={100}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge variant="secondary" className="cursor-default text-xs font-normal">
                                      <span className="truncate max-w-[150px] mr-1.5">{p.name}</span>
                                      <Badge className={cn('text-xs py-0 px-1', statusColors[p.status])}>
                                        {p.status.substring(0,1)}
                                      </Badge>
                                      <Badge variant="outline" className={cn("ml-1 text-xs py-0 px-1", priorityColors[p.priority])}>
                                        {p.priority.substring(0,1)}
                                      </Badge>
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent className="text-xs">
                                    <p className="font-semibold">{p.name}</p>
                                    <p>Status: {p.status}</p>
                                    <p>Priority: {p.priority}</p>
                                    <p>Completion: {p.completionPercentage}%</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ))}
                             {lead.projects.filter(p => p.status === 'Completed').length > 0 && (
                                <Badge variant="outline" className="text-xs font-normal">
                                    +{lead.projects.filter(p => p.status === 'Completed').length} completed
                                </Badge>
                             )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

