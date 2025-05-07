
'use client';

import type { Project, ProjectStatus } from '@/types/project';
import type { CalculatedProjectMetrics } from '@/types/project-reports';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Loader2, ListChecks } from 'lucide-react'; // Added ListChecks
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
        <CardTitle className="text-lg flex items-center"> {/* Flex to align icon */}
          <ListChecks className="h-5 w-5 mr-2 text-primary" /> {/* Added icon */}
          Project Performance Details
        </CardTitle>
        <CardDescription className="text-xs">Comprehensive overview of filtered projects, their status, and key metrics.</CardDescription>
      </CardHeader>
      <CardContent className="pt-2 px-0 pb-2"> {/* Removed horizontal padding */}
        <ScrollArea className="h-[500px] w-full">
          {/* Added overflow-x-auto for smaller screens if table is too wide */}
          <div className="overflow-x-auto"> 
            <Table className="min-w-full"> {/* Ensure table takes minimum full width */}
              <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                <TableRow>
                  {/* Adjusted padding and alignment */}
                  <TableHead className="w-[200px] py-2 px-4 text-xs font-semibold text-muted-foreground whitespace-nowrap text-left">Project Name</TableHead>
                  <TableHead className="w-[100px] py-2 px-4 text-xs font-semibold text-muted-foreground whitespace-nowrap text-left">Status</TableHead>
                  <TableHead className="w-[80px] py-2 px-4 text-xs font-semibold text-muted-foreground whitespace-nowrap text-left">Priority</TableHead>
                  <TableHead className="w-[120px] text-right py-2 px-4 text-xs font-semibold text-muted-foreground whitespace-nowrap">Completion %</TableHead>
                  <TableHead className="w-[100px] text-right py-2 px-4 text-xs font-semibold text-muted-foreground whitespace-nowrap">Budget</TableHead>
                  <TableHead className="w-[100px] text-right py-2 px-4 text-xs font-semibold text-muted-foreground whitespace-nowrap">Spent</TableHead>
                  <TableHead className="w-[100px] text-right py-2 px-4 text-xs font-semibold text-muted-foreground whitespace-nowrap">Variance</TableHead>
                  <TableHead className="w-[100px] py-2 px-4 text-xs font-semibold text-muted-foreground whitespace-nowrap text-left">Start Date</TableHead>
                  <TableHead className="w-[100px] py-2 px-4 text-xs font-semibold text-muted-foreground whitespace-nowrap text-left">End Date</TableHead>
                  <TableHead className="w-[150px] py-2 px-4 text-xs font-semibold text-muted-foreground whitespace-nowrap text-left">Timeline</TableHead>
                  <TableHead className="w-[120px] py-2 px-4 text-xs font-semibold text-muted-foreground whitespace-nowrap text-left">Team Lead</TableHead>
                  <TableHead className="w-[120px] py-2 px-4 text-xs font-semibold text-muted-foreground whitespace-nowrap text-left">Portfolio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.length === 0 && (
                  <TableRow><TableCell colSpan={12} className="h-20 text-center text-muted-foreground text-sm">No projects match the current filters.</TableCell></TableRow>
                )}
                {filteredProjects.map(project => {
                  const metrics = projectMetrics[project.id];
                  const currentStatusStyles = statusStyles[project.status] || statusStyles['Planning'];
                  const StatusIconElement = statusIcons[project.status];
                  let daysRemainingDisplay: React.ReactNode = <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />;
                  if (!isLoadingMetrics && metrics) {
                    if (project.status === 'Completed') {
                      daysRemainingDisplay = <span className="text-green-600 dark:text-green-400 font-medium text-xs">Completed</span>;
                    } else if (metrics.isOverdue) {
                      daysRemainingDisplay = <span className="text-red-600 dark:text-red-400 font-medium text-xs">{Math.abs(metrics.daysRemaining)} days overdue</span>;
                    } else {
                      daysRemainingDisplay = <span className="text-muted-foreground text-xs">{metrics.daysRemaining} days remaining</span>;
                    }
                  } else if (!isLoadingMetrics) {
                    daysRemainingDisplay = <span className="text-muted-foreground text-xs">N/A</span>;
                  }

                  return (
                    <TableRow key={project.id} className="hover:bg-muted/30 text-xs">
                      {/* Adjusted padding */}
                      <TableCell className="font-medium text-foreground py-2 px-4 whitespace-nowrap">{project.name}</TableCell>
                      <TableCell className="py-2 px-4">
                        <Badge className={cn('text-[11px] px-2 py-0.5 font-medium', currentStatusStyles.badge)} variant="outline"> {/* Slightly smaller text */}
                          {StatusIconElement && <StatusIconElement className="mr-1 h-2.5 w-2.5" />} {/* Smaller icon */}
                          {project.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2 px-4">
                        <Badge variant="outline" className={cn("text-[11px] px-1.5 py-0.5 font-medium", priorityColors[project.priority])}>
                          {project.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right py-2 px-4">
                        <div className="flex items-center justify-end gap-1.5"> {/* Added gap */}
                          <span className="text-xs">{project.completionPercentage}%</span>
                          <Progress value={project.completionPercentage} className="h-1.5 w-16" indicatorClassName={currentStatusStyles.progress} aria-label={`${project.completionPercentage}% complete`} />
                        </div>
                      </TableCell>
                      <TableCell className="text-right py-2 px-4 whitespace-nowrap">{formatCurrency(project.budget)}</TableCell>
                      <TableCell className="text-right py-2 px-4 whitespace-nowrap">{formatCurrency(project.spent)}</TableCell>
                      <TableCell className={cn("text-right py-2 px-4 font-medium whitespace-nowrap", project.budget - project.spent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
                        {formatCurrency(project.budget - project.spent)}
                      </TableCell>
                      <TableCell className="py-2 px-4 text-muted-foreground whitespace-nowrap">{formatDate(project.startDate)}</TableCell>
                      <TableCell className="py-2 px-4 text-muted-foreground whitespace-nowrap">{formatDate(project.endDate)}</TableCell>
                      <TableCell className="py-2 px-4 whitespace-nowrap">
                        {daysRemainingDisplay}
                      </TableCell>
                      <TableCell className="py-2 px-4 text-muted-foreground whitespace-nowrap">{project.teamLead}</TableCell>
                      <TableCell className="py-2 px-4 text-muted-foreground">{project.portfolio}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
