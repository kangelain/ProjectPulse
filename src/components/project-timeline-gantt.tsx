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

// Define project status colors for the main bar (track) and progress fill
const projectBarColors: Record<Project['status'], { track: string; fill: string; text?: string }> = {
  'On Track': { track: 'bg-primary/30', fill: 'bg-primary' },
  'At Risk': { track: 'bg-red-500/30', fill: 'bg-red-600' },
  'Delayed': { track: 'bg-yellow-500/30', fill: 'bg-yellow-500', text: 'text-yellow-800' }, // Darker text for yellow
  'Completed': { track: 'bg-green-500/30', fill: 'bg-green-600' },
  'Planning': { track: 'bg-gray-400/30', fill: 'bg-gray-500' },
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

  while (currentDateIterator <= overallEndDate || monthMarkers.length < 2) { 
    monthMarkers.push(new Date(currentDateIterator));
    const daysIncrement = Math.max(1, Math.floor(totalDurationDays / 12)) || 30; 
    currentDateIterator = addDays(currentDateIterator, daysIncrement);
    if (monthMarkers.length > 24 && totalDurationDays > 365 * 2) break; 
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
            <div className="relative py-3 px-2 min-w-max"> 
              {/* Timeline Header with Month Markers */}
              <div className="sticky top-0 z-10 h-12 bg-background/80 backdrop-blur-sm border-b mb-4 flex items-end">
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
                const barStyle = projectBarColors[project.status] || projectBarColors['Planning'];


                return (
                  <div key={project.id} className={cn("mb-4", projectIndex > 0 && "mt-1")}>
                    <h4 className="text-sm font-semibold mb-1.5 text-foreground truncate max-w-[200px] sm:max-w-xs md:max-w-sm lg:max-w-md xl:max-w-lg">
                        {project.name}
                    </h4>
                    <div className="relative h-8 bg-muted rounded-md overflow-hidden group"> {/* Main track for the bar + milestones */}
                       <Tooltip>
                        <TooltipTrigger asChild>
                           <div
                            className={cn(
                              "absolute h-full rounded-md transition-all duration-150 ease-in-out", 
                              barStyle.track
                            )}
                            style={{
                              left: `${Math.max(0, projectOffsetLeft)}%`,
                              width: `${Math.min(100 - Math.max(0, projectOffsetLeft), projectWidth)}%`, 
                            }}
                          >
                            {/* Progress Fill */}
                            <div
                              className={cn(
                                "absolute top-0 left-0 h-full rounded-l-md",
                                barStyle.fill,
                                project.completionPercentage === 100 && "rounded-r-md" // Full rounding if 100%
                              )}
                              style={{ width: `${project.completionPercentage}%` }}
                            />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="bg-popover text-popover-foreground p-2 rounded-md shadow-lg border">
                          <p className="font-semibold text-sm">{project.name}</p>
                          <p className="text-xs">{format(projectStart, 'MMM d, yyyy')} - {format(projectEnd, 'MMM d, yyyy')}</p>
                          <p className="text-xs">Status: <span className={cn(barStyle.text)}>{project.status}</span></p>
                          <p className="text-xs">Progress: {project.completionPercentage}%</p>
                        </TooltipContent>
                      </Tooltip>

                      {/* Milestones: Positioned relative to the main track div */}
                      {project.keyMilestones.map((milestone) => {
                        const milestoneDate = parseISO(milestone.date);
                        // Ensure milestone is within the project's actual duration for correct relative positioning
                        if (milestoneDate < projectStart || milestoneDate > projectEnd) return null;

                        const milestoneOffsetWithinProjectBar = (differenceInDays(milestoneDate, projectStart) / projectDurationDays) * 100;
                        // Calculate absolute offset for positioning on the overall timeline track
                        const absoluteMilestoneOffset = projectOffsetLeft + (milestoneOffsetWithinProjectBar / 100 * projectWidth);

                        const clampedAbsoluteMilestoneOffset = Math.max(0, Math.min(100, absoluteMilestoneOffset));
                        
                        const MilestoneIcon = milestoneStatusIcons[milestone.status];

                        return (
                           <Tooltip key={milestone.id}>
                            <TooltipTrigger asChild>
                              <div
                                className={cn(
                                  "absolute top-1/2 -translate-y-1/2 w-[18px] h-[18px] rounded-full flex items-center justify-center shadow-md border-2 cursor-pointer",
                                  "hover:scale-125 hover:shadow-lg transition-all duration-150 z-20", // Hover effect
                                  milestoneStatusColors[milestone.status]
                                )}
                                style={{ left: `${clampedAbsoluteMilestoneOffset}%`, transform: `translateX(-50%) translateY(-50%)` }} 
                              >
                                <MilestoneIcon className="w-2.5 h-2.5 text-white" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="bg-popover text-popover-foreground p-2 rounded-md shadow-lg border">
                              <p className="font-semibold text-sm">{milestone.name}</p>
                              <p className="text-xs">Target: {format(milestoneDate, 'MMM d, yyyy')}</p>
                              <p className="text-xs">Status: {milestone.status}</p>
                              {milestone.assignedTo && <p className="text-xs">Assigned: {milestone.assignedTo}</p>}
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

