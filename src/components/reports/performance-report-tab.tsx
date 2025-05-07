'use client';

import type { Project, ProjectStatus } from '@/types/project';
import type { CalculatedProjectMetrics } from '@/types/project-reports';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { statusStyles, priorityColors, statusIcons } from '@/app/reports/report-style-definitions';

interface PerformanceReportTabProps {
  filteredProjects: Project[];
  projectMetrics: Record<string, CalculatedProjectMetrics | null>;
  isLoadingMetrics: boolean;
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string, csvFormat?: boolean) => string;
}

export function PerformanceReportTab({
  filteredProjects,
  projectMetrics,
  isLoadingMetrics,
  formatCurrency,
  formatDate,
}: PerformanceReportTabProps) {
  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-3 pt-4 px-4">
        <CardTitle className="text-lg">Project Performance Details</CardTitle>
        <CardDescription className="text-xs">Comprehensive overview of filtered projects, their status, and key metrics.</CardDescription>
      </CardHeader>
      <CardContent className="pt-2 px-2 pb-2">
        <ScrollArea className="h-[500px] w-full">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
              <TableRow>
                <TableHead className="w-[180px] py-2.5 px-3 text-xs whitespace-nowrap">Project Name</TableHead>
                <TableHead className="py-2.5 px-3 text-xs">Status</TableHead>
                <TableHead className="py-2.5 px-3 text-xs">Priority</TableHead>
                <TableHead className="text-right py-2.5 px-3 text-xs whitespace-nowrap">Completion %</TableHead>
                <TableHead className="text-right py-2.5 px-3 text-xs">Budget</TableHead>
                <TableHead className="text-right py-2.5 px-3 text-xs">Spent</TableHead>
                <TableHead className="text-right py-2.5 px-3 text-xs">Variance</TableHead>
                <TableHead className="py-2.5 px-3 text-xs whitespace-nowrap">Start Date</TableHead>
                <TableHead className="py-2.5 px-3 text-xs whitespace-nowrap">End Date</TableHead>
                <TableHead className="py-2.5 px-3 text-xs whitespace-nowrap">Timeline</TableHead>
                <TableHead className="py-2.5 px-3 text-xs whitespace-nowrap">Team Lead</TableHead>
                <TableHead className="py-2.5 px-3 text-xs">Portfolio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.length === 0 && (
                <TableRow><TableCell colSpan={12} className="h-20 text-center text-muted-foreground text-xs">No projects match the current filters.</TableCell></TableRow>
              )}
              {filteredProjects.map(project => {
                const metrics = projectMetrics[project.id];
                const currentStatusStyles = statusStyles[project.status] || statusStyles['Planning'];
                const StatusIconElement = statusIcons[project.status];
                let daysRemainingDisplay: React.ReactNode = <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />;
                if (!isLoadingMetrics && metrics) {
                  if (project.status === 'Completed') {
                    daysRemainingDisplay = <span className="text-green-600 dark:text-green-400 font-medium text-xs">Completed</span>;
                  } else if (metrics.isOverdue) {
                    daysRemainingDisplay = <span className="text-red-600 dark:text-red-400 font-medium text-xs">{Math.abs(metrics.daysRemaining)} days overdue</span>;
                  } else {
                    daysRemainingDisplay = <span className="text-muted-foreground text-xs">{metrics.daysRemaining} days left</span>;
                  }
                } else if (!isLoadingMetrics) {
                  daysRemainingDisplay = <span className="text-muted-foreground text-xs">N/A</span>;
                }

                return (
                  <TableRow key={project.id} className="hover:bg-muted/30 text-xs">
                    <TableCell className="font-medium text-primary py-2 px-3 whitespace-nowrap">{project.name}</TableCell>
                    <TableCell className="py-2 px-3">
                      <Badge className={cn('text-xs px-2 py-0.5', currentStatusStyles.badge)} variant="outline">
                        {StatusIconElement && <StatusIconElement className="mr-1 h-3 w-3" />}
                        {project.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2 px-3">
                      <Badge variant="outline" className={cn("text-xs px-1.5 py-0.5", priorityColors[project.priority])}>
                        {project.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right py-2 px-3">
                      <div className="flex items-center justify-end">
                        <span className="mr-1.5 text-xs">{project.completionPercentage}%</span>
                        <Progress value={project.completionPercentage} className="h-1.5 w-12 sm:w-16" indicatorClassName={currentStatusStyles.progress} aria-label={`${project.completionPercentage}% complete`} />
                      </div>
                    </TableCell>
                    <TableCell className="text-right py-2 px-3">{formatCurrency(project.budget)}</TableCell>
                    <TableCell className="text-right py-2 px-3">{formatCurrency(project.spent)}</TableCell>
                    <TableCell className={cn("text-right py-2 px-3 font-medium", project.budget - project.spent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
                      {formatCurrency(project.budget - project.spent)}
                    </TableCell>
                    <TableCell className="py-2 px-3 text-muted-foreground whitespace-nowrap">{formatDate(project.startDate)}</TableCell>
                    <TableCell className="py-2 px-3 text-muted-foreground whitespace-nowrap">{formatDate(project.endDate)}</TableCell>
                    <TableCell className="py-2 px-3 whitespace-nowrap">
                      {daysRemainingDisplay}
                    </TableCell>
                    <TableCell className="py-2 px-3 text-muted-foreground whitespace-nowrap">{project.teamLead}</TableCell>
                    <TableCell className="py-2 px-3 text-muted-foreground">{project.portfolio}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
