
'use client';

import * as React from 'react'; // Added React import
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
import { UsersRound } from 'lucide-react'; // Added icon

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
        <CardTitle className="text-lg flex items-center"> {/* Flex to align icon */}
          <UsersRound className="h-5 w-5 mr-2 text-primary"/> {/* Added icon */}
          Team Overview &amp; Workload
        </CardTitle>
        <CardDescription className="text-xs">Breakdown of projects managed by each team lead, based on current filters.</CardDescription>
      </CardHeader>
      <CardContent className="pt-2 px-0 pb-2"> {/* Removed horizontal padding */}
        <ScrollArea className="h-[500px] w-full">
          <div className="overflow-x-auto"> {/* Added overflow for smaller screens */}
            <Table className="min-w-full"> {/* Ensure table takes minimum full width */}
              <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                <TableRow>
                  {/* Adjusted padding, font weight, alignment */}
                  <TableHead className="w-[150px] py-2 px-4 text-xs font-semibold text-muted-foreground whitespace-nowrap text-left">Team Lead</TableHead>
                  <TableHead className="w-[100px] text-center py-2 px-4 text-xs font-semibold text-muted-foreground whitespace-nowrap">Total Projects</TableHead>
                  <TableHead className="w-[80px] text-center py-2 px-4 text-xs font-semibold text-muted-foreground whitespace-nowrap">Active</TableHead>
                  <TableHead className="w-[100px] text-center py-2 px-4 text-xs font-semibold text-muted-foreground whitespace-nowrap">Completed</TableHead>
                  <TableHead className="w-[150px] text-right py-2 px-4 text-xs font-semibold text-muted-foreground whitespace-nowrap">Avg. Active Comp. %</TableHead>
                  <TableHead className="w-[150px] text-right py-2 px-4 text-xs font-semibold text-muted-foreground whitespace-nowrap">Total Budget ($)</TableHead>
                  <TableHead className="min-w-[180px] py-2 px-4 text-xs font-semibold text-muted-foreground text-left">Active Project Statuses</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamLeadWorkloads.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="h-20 text-center text-muted-foreground text-sm">No team lead data for current filters.</TableCell></TableRow>
                )}
                {teamLeadWorkloads.map(lead => (
                  <TableRow key={lead.teamLead} className="hover:bg-muted/30 text-xs">
                    {/* Adjusted padding and vertical alignment */}
                    <TableCell className="font-medium py-2 px-4 whitespace-nowrap align-middle">{lead.teamLead}</TableCell>
                    <TableCell className="text-center py-2 px-4 align-middle">{lead.projectCount}</TableCell>
                    <TableCell className="text-center py-2 px-4 align-middle">{lead.activeProjectsCount}</TableCell>
                    <TableCell className="text-center py-2 px-4 align-middle">{lead.completedProjectsCount}</TableCell>
                    <TableCell className="text-right py-2 px-4 align-middle">
                      <div className="flex items-center justify-end gap-1.5"> {/* Added gap */}
                        <span className="text-xs">{lead.averageCompletionPercentage.toFixed(1)}%</span>
                        <Progress value={lead.averageCompletionPercentage} className="h-1.5 w-16" indicatorClassName={statusStyles['On Track'].progress} aria-label={`Average active completion ${lead.averageCompletionPercentage}%`} />
                      </div>
                    </TableCell>
                    <TableCell className="text-right py-2 px-4 whitespace-nowrap align-middle">{formatCurrency(lead.totalBudgetManaged)}</TableCell>
                    <TableCell className="py-2 px-4 align-middle">
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
                                    <Badge className={cn('text-[11px] px-1.5 py-0.5 font-medium cursor-default', currentStatusStyles.badge)} variant="outline"> {/* Slightly smaller text */}
                                      {StatusIconElement && React.createElement(StatusIconElement, { className: "h-2.5 w-2.5 mr-1" })} {/* Smaller icon */}
                                      {count}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent className="text-xs p-1.5 bg-popover shadow-md rounded-md border"> {/* Adjusted padding */}
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
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
