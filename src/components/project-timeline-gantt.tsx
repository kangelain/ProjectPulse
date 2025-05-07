
"use client";

import type { Project, KeyMilestone } from '@/types/project';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format, parseISO, differenceInDays, addDays, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { TrendingUp, CheckCircle, AlertCircle, Clock, GanttChartSquare } from 'lucide-react';

interface ProjectTimelineGanttProps {
  projects: Project[];
}

const milestoneStatusColors: Record<KeyMilestone['status'], string> = {
  'Pending': 'bg-gray-400 border-gray-500',
  'In Progress': 'bg-blue-500 border-blue-600',
  'Completed': 'bg-green-500 border-green-600',
  'Blocked': 'bg-red-500 border-red-600',
};

const milestoneStatusIcons: Record<KeyMilestone['status'], React.ElementType> = {
  'Pending': Clock,
  'In Progress': TrendingUp,
  'Completed': CheckCircle,
  'Blocked': AlertCircle,
};

export function ProjectTimelineGantt({ projects }: ProjectTimelineGanttProps) {
  if (!projects.length) {
    return (
      <Card className="shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl">Project Timelines</CardTitle>
          <CardDescription>No project data available for timeline visualization.</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] flex flex-col items-center justify-center text-center p-6">
          <GanttChartSquare className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-lg">No Timeline Data</p>
          <p className="text-sm text-muted-foreground">There are no projects with timeline information in the current selection.</p>
        </CardContent>
      </Card>
    );
  }

  const overallStartDate = projects.reduce((earliest, p) => {
    const projStart = parseISO(p.startDate);
    return projStart < earliest ? projStart : earliest;
  }, parseISO(projects[0].startDate));

  const overallEndDate = projects.reduce((latest, p) => {
    const projEnd = parseISO(p.endDate);
    return projEnd > latest ? projEnd : latest;
  }, parseISO(projects[0].endDate));
  
  const totalDurationDays = Math.max(1, differenceInDays(overallEndDate, overallStartDate));

  const monthMarkers = [];
  let currentDateIterator = overallStartDate;
  const today = new Date();

  while (currentDateIterator <= overallEndDate || monthMarkers.length < 2) { // Ensure at least 2 markers if duration is very short
    monthMarkers.push(new Date(currentDateIterator));
    const daysIncrement = Math.max(1, Math.floor(totalDurationDays / 12)) || 30;
    currentDateIterator = addDays(currentDateIterator, daysIncrement);
    if (monthMarkers.length > 24 && totalDurationDays > 365 * 2) break; // Cap markers for very long durations
  }
   if (monthMarkers.length > 0 && !isSameDay(monthMarkers[monthMarkers.length-1], overallEndDate) && overallEndDate > monthMarkers[monthMarkers.length-1]) {
    monthMarkers.push(overallEndDate);
  }


  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl">Project Timelines</CardTitle>
        <CardDescription>Visual overview of project durations and key milestones.</CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        <TooltipProvider delayDuration={150}>
          <ScrollArea className="w-full h-[500px] whitespace-nowrap border rounded-md bg-secondary/20">
            <div className="relative py-3 px-2 min-w-max"> {/* Added min-w-max */}
              {/* Timeline Header with Month Markers */}
              <div className="sticky top-0 z-10 h-12 bg-background/80 backdrop-blur-sm border-b mb-4 flex items-end"> {/* Increased height, added flex items-end */}
                <div className="relative h-full w-full">
                  {monthMarkers.map((month, index) => {
                    const offsetPercent = (differenceInDays(month, overallStartDate) / totalDurationDays) * 100;
                    const clampedOffsetPercent = Math.max(0, Math.min(100, offsetPercent));

                    return (
                      <div
                        key={`marker-${index}`}
                        className="absolute top-0 h-full flex flex-col items-center"
                        style={{ left: `${clampedOffsetPercent}%`, transform: 'translateX(-50%)' }}
                        aria-hidden="true"
                      >
                        <span className="text-xs font-medium text-muted-foreground whitespace-nowrap pt-1.5">
                          {format(month, 'MMM yy')}
                        </span>
                        <div className="flex-grow w-px bg-border/70 mt-1"></div>
                      </div>
                    );
                  })}
                  {/* Today Marker */}
                  {today >= overallStartDate && today <= overallEndDate && (
                     <div
                        className="absolute top-0 h-full flex flex-col items-center z-10"
                        style={{ left: `${(differenceInDays(today, overallStartDate) / totalDurationDays) * 100}%`, transform: 'translateX(-50%)' }}
                        aria-label="Today"
                      >
                        <span className="text-xs font-bold text-primary whitespace-nowrap pt-1.5">
                          Today
                        </span>
                        <div className="flex-grow w-0.5 bg-primary mt-1"></div>
                      </div>
                  )}
                </div>
              </div>

              {/* Project Rows */}
              {projects.map((project, projectIndex) => {
                const projectStart = parseISO(project.startDate);
                const projectEnd = parseISO(project.endDate);
                const projectDurationDays = Math.max(1, differenceInDays(projectEnd, projectStart));
                
                const projectOffsetLeft = (differenceInDays(projectStart, overallStartDate) / totalDurationDays) * 100;
                const projectWidth = (projectDurationDays / totalDurationDays) * 100;

                return (
                  <div key={project.id} className={cn("mb-3", projectIndex > 0 && "mt-1")}>
                    <h4 className="text-xs font-medium mb-1.5 text-foreground truncate max-w-[200px] sm:max-w-xs md:max-w-sm lg:max-w-md xl:max-w-lg">
                        {project.name}
                    </h4>
                    <div className="relative h-7 bg-muted rounded-sm overflow-visible"> {/* Increased height, overflow-visible for tooltips */}
                       <Tooltip>
                        <TooltipTrigger asChild>
                           <div
                            className={cn(
                              "absolute h-full rounded-sm transition-all duration-150 ease-in-out", 
                              project.status === 'Completed' ? 'bg-green-500/80 hover:bg-green-500' :
                              project.status === 'At Risk' ? 'bg-red-500/80 hover:bg-red-500' :
                              project.status === 'Delayed' ? 'bg-yellow-500/80 hover:bg-yellow-500 text-black' : // Text black for yellow
                              project.status === 'Planning' ? 'bg-gray-400/80 hover:bg-gray-400' :
                              'bg-primary/80 hover:bg-primary' 
                            )}
                            style={{
                              left: `${Math.max(0, projectOffsetLeft)}%`,
                              width: `${Math.min(100 - Math.max(0, projectOffsetLeft), projectWidth)}%`, 
                            }}
                          />
                        </TooltipTrigger>
                        <TooltipContent className="bg-popover text-popover-foreground p-2 rounded-md shadow-lg border">
                          <p className="font-semibold text-sm">{project.name}</p>
                          <p className="text-xs">{format(projectStart, 'MMM d, yyyy')} - {format(projectEnd, 'MMM d, yyyy')}</p>
                          <p className="text-xs">Status: {project.status}</p>
                          <p className="text-xs">Progress: {project.completionPercentage}%</p>
                        </TooltipContent>
                      </Tooltip>

                      {/* Milestones */}
                      {project.keyMilestones.map((milestone) => {
                        const milestoneDate = parseISO(milestone.date);
                        if (milestoneDate < projectStart || milestoneDate > projectEnd) return null;

                        const milestoneOffsetWithinProject = (differenceInDays(milestoneDate, projectStart) / projectDurationDays) * 100;
                        const clampedMilestoneOffset = Math.max(0, Math.min(100, milestoneOffsetWithinProject));
                        const MilestoneIcon = milestoneStatusIcons[milestone.status];

                        return (
                           <Tooltip key={milestone.id}>
                            <TooltipTrigger asChild>
                              <div
                                className={cn(
                                  "absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full flex items-center justify-center shadow-md border-2",
                                  milestoneStatusColors[milestone.status]
                                )}
                                style={{ left: `${clampedMilestoneOffset}%`, transform: `translateX(-50%) translateY(-50%)` }} 
                              >
                                <MilestoneIcon className="w-2 h-2 text-white" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="bg-popover text-popover-foreground p-2 rounded-md shadow-lg border">
                              <p className="font-semibold text-sm">{milestone.name}</p>
                              <p className="text-xs">Date: {format(milestoneDate, 'MMM d, yyyy')}</p>
                              <p className="text-xs">Status: {milestone.status}</p>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
