"use client";

import type { Project, KeyMilestone } from '@/types/project';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format, parseISO, differenceInDays, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { TrendingUp, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface ProjectTimelineGanttProps {
  projects: Project[];
}

const milestoneStatusColors: Record<KeyMilestone['status'], string> = {
  'Pending': 'bg-gray-400',
  'In Progress': 'bg-blue-500',
  'Completed': 'bg-green-500',
  'Blocked': 'bg-red-500',
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
      <Card>
        <CardHeader>
          <CardTitle>Project Timelines</CardTitle>
          <CardDescription>No project data available for timeline visualization.</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <p className="text-muted-foreground">No data</p>
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

  // Generate month markers for the timeline header
  const monthMarkers = [];
  let currentDate = overallStartDate;
  while (currentDate <= overallEndDate) {
    monthMarkers.push(new Date(currentDate));
    currentDate = addDays(currentDate, 30); // Approximate month step
  }


  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Project Timelines</CardTitle>
        <CardDescription>Visual overview of project durations and key milestones.</CardDescription>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <ScrollArea className="w-full h-[500px] whitespace-nowrap">
            <div className="relative py-2">
              {/* Timeline Header with Month Markers */}
              <div className="sticky top-0 z-10 flex h-10 items-end bg-background border-b mb-2">
                {monthMarkers.map((month, index) => {
                  const offset = (differenceInDays(month, overallStartDate) / totalDurationDays) * 100;
                  return (
                    <div
                      key={index}
                      className="absolute text-xs text-muted-foreground"
                      style={{ left: `${offset}%` }}
                    >
                      | {format(month, 'MMM yy')}
                    </div>
                  );
                })}
              </div>

              {/* Project Rows */}
              {projects.map((project) => {
                const projectStart = parseISO(project.startDate);
                const projectEnd = parseISO(project.endDate);
                const projectDurationDays = Math.max(1, differenceInDays(projectEnd, projectStart));
                
                const projectOffsetLeft = (differenceInDays(projectStart, overallStartDate) / totalDurationDays) * 100;
                const projectWidth = (projectDurationDays / totalDurationDays) * 100;

                return (
                  <div key={project.id} className="mb-4">
                    <h4 className="text-sm font-medium mb-1 text-primary">{project.name}</h4>
                    <div className="relative h-8 bg-muted rounded overflow-hidden">
                      {/* Project Bar */}
                       <Tooltip>
                        <TooltipTrigger asChild>
                           <div
                            className={cn(
                              "absolute h-full bg-primary opacity-70 rounded",
                              project.status === 'Completed' && 'bg-green-600',
                              project.status === 'At Risk' && 'bg-red-600',
                              project.status === 'Delayed' && 'bg-yellow-600',
                            )}
                            style={{
                              left: `${Math.max(0, projectOffsetLeft)}%`,
                              width: `${Math.min(100, projectWidth)}%`,
                            }}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-semibold">{project.name}</p>
                          <p>{format(projectStart, 'MMM dd, yyyy')} - {format(projectEnd, 'MMM dd, yyyy')}</p>
                          <p>Status: {project.status}</p>
                        </TooltipContent>
                      </Tooltip>

                      {/* Milestones */}
                      {project.keyMilestones.map((milestone) => {
                        const milestoneDate = parseISO(milestone.date);
                        if (milestoneDate < projectStart || milestoneDate > projectEnd) return null;

                        const milestoneOffsetLeft = (differenceInDays(milestoneDate, projectStart) / projectDurationDays) * 100;
                        const MilestoneIcon = milestoneStatusIcons[milestone.status];

                        return (
                           <Tooltip key={milestone.id}>
                            <TooltipTrigger asChild>
                              <div
                                className={cn(
                                  "absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full flex items-center justify-center",
                                  milestoneStatusColors[milestone.status]
                                )}
                                style={{ left: `${milestoneOffsetLeft}%` }}
                              >
                                <MilestoneIcon className="w-2 h-2 text-white" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="font-semibold">{milestone.name}</p>
                              <p>Date: {format(milestoneDate, 'MMM dd, yyyy')}</p>
                              <p>Status: {milestone.status}</p>
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
