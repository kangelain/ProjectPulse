'use client';

import type { ProjectStatus } from '@/types/project';
import type { TeamLeadWorkload } from '@/types/project-reports';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { statusStyles, statusIcons } from '@/app/reports/report-style-definitions';

interface ResourceReportTabProps {
  teamLeadWorkloads: TeamLeadWorkload[];
  formatCurrency: (amount: number) => string;
}

export function ResourceReportTab({
  teamLeadWorkloads,
  formatCurrency,
}: ResourceReportTabProps) {
  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-3 pt-4 px-4">
        <CardTitle className="text-lg">Team Overview &amp; Workload</CardTitle>
        <CardDescription className="text-xs">Breakdown of projects managed by each team lead, based on current filters.</CardDescription>
      </CardHeader>
      <CardContent className="pt-2 px-2 pb-2">
        <ScrollArea className="h-[500px] w-full">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
              <TableRow>
                <TableHead className="w-[150px] py-2.5 px-3 text-xs whitespace-nowrap">Team Lead</TableHead>
                <TableHead className="text-center py-2.5 px-3 text-xs whitespace-nowrap">Total Projects</TableHead>
                <TableHead className="text-center py-2.5 px-3 text-xs whitespace-nowrap">Active</TableHead>
                <TableHead className="text-center py-2.5 px-3 text-xs whitespace-nowrap">Completed</TableHead>
                <TableHead className="text-right py-2.5 px-3 text-xs whitespace-nowrap">Avg. Active Comp. %</TableHead>
                <TableHead className="text-right py-2.5 px-3 text-xs whitespace-nowrap">Total Budget ($)</TableHead>
                <TableHead className="py-2.5 px-3 text-xs">Active Project Statuses</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamLeadWorkloads.length === 0 && (
                <TableRow><TableCell colSpan={7} className="h-20 text-center text-muted-foreground text-xs">No team lead data for current filters.</TableCell></TableRow>
              )}
              {teamLeadWorkloads.map(lead => (
                <TableRow key={lead.teamLead} className="hover:bg-muted/30 text-xs">
                  <TableCell className="font-medium py-2 px-3 whitespace-nowrap">{lead.teamLead}</TableCell>
                  <TableCell className="text-center py-2 px-3">{lead.projectCount}</TableCell>
                  <TableCell className="text-center py-2 px-3">{lead.activeProjectsCount}</TableCell>
                  <TableCell className="text-center py-2 px-3">{lead.completedProjectsCount}</TableCell>
                  <TableCell className="text-right py-2 px-3">
                    <div className="flex items-center justify-end">
                      <span className="mr-1.5 text-xs">{lead.averageCompletionPercentage.toFixed(1)}%</span>
                      <Progress value={lead.averageCompletionPercentage} className="h-1.5 w-12 sm:w-16" indicatorClassName={statusStyles['On Track'].progress} aria-label={`Average active completion ${lead.averageCompletionPercentage}%`} />
                    </div>
                  </TableCell>
                  <TableCell className="text-right py-2 px-3">{formatCurrency(lead.totalBudgetManaged)}</TableCell>
                  <TableCell className="py-2 px-3">
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(lead.statusDistribution)
                        .filter(([status, count]) => status !== 'Completed' && count > 0)
                        .map(([status, count]) => {
                          const StatusIconElement = statusIcons[status as ProjectStatus];
                          const currentStatusStyles = statusStyles[status as ProjectStatus] || statusStyles['Planning'];
                          return (
                            <TooltipProvider key={status} delayDuration={100}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge className={cn('text-xs px-1.5 py-0.5', currentStatusStyles.badge)} variant="outline">
                                    {StatusIconElement && React.createElement(StatusIconElement, { className: "h-2.5 w-2.5 mr-0.5" })}
                                    {count}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent className="text-xs p-1 bg-popover shadow-sm rounded-sm border">
                                  {count} {status} project{count > 1 ? 's' : ''}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          );
                        })}
                      {lead.activeProjectsCount === 0 && <span className="text-xs text-muted-foreground italic">No active projects</span>}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
