
"use client";

import type { Project, ProjectStatus } from '@/types/project';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid, Cell } from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

interface ProjectProgressChartProps {
  projects: Project[];
}

const chartConfig = {
  count: {
    label: "Projects",
  },
  "On Track": {
    label: "On Track",
    color: "hsl(var(--chart-1))", 
  },
  "At Risk": {
    label: "At Risk",
    color: "hsl(var(--chart-2))", 
  },
  "Delayed": {
    label: "Delayed",
    color: "hsl(var(--chart-4))", 
  },
  "Completed": {
    label: "Completed",
    color: "hsl(var(--chart-3))", 
  },
  "Planning": {
    label: "Planning",
    color: "hsl(var(--chart-5))", 
  },
} satisfies ChartConfig;


export function ProjectProgressChart({ projects }: ProjectProgressChartProps) {
  const dataByStatus = (Object.keys(chartConfig) as Array<keyof typeof chartConfig>)
    .filter(key => key !== 'count') 
    .map(status => ({
      status: status as ProjectStatus | string, 
      count: projects.filter(p => p.status === status).length,
      fill: chartConfig[status as keyof typeof chartConfig]?.color || "hsl(var(--muted))",
    }))
    .filter(item => item.count > 0); 

  if (!projects.length || !dataByStatus.length) {
    return (
      <Card className="shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl">Project Status Overview</CardTitle>
          <CardDescription>No project data available to display chart.</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex flex-col items-center justify-center text-center p-6">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-lg">No Status Data</p>
            <p className="text-sm text-muted-foreground">There are no projects with status information in the current selection.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl">Project Status Overview</CardTitle>
        <CardDescription>Distribution of projects by their current status.</CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={dataByStatus}
              layout="vertical"
              margin={{ left: 10, right: 20, top: 5, bottom: 5 }}
              barCategoryGap="25%"
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis 
                type="number" 
                dataKey="count" 
                allowDecimals={false} 
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis
                dataKey="status"
                type="category"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={80}
                tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }}
              />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
                content={({ active, payload, label }) => (
                  active && payload && payload.length ? (
                    <div className="bg-popover p-3 shadow-lg rounded-md border border-border text-popover-foreground">
                      <p className="label text-sm font-bold mb-1.5">{`${label}`}</p>
                      {payload.map((entry, index) => (
                         <p key={`item-${index}`} style={{ color: entry.payload.fill }} className="text-xs">
                          <span className="font-medium">{`${entry.name}:`}</span>
                          {` ${entry.value} project${entry.value === 1 ? '' : 's'}`}
                        </p>
                      ))}
                    </div>
                  ) : null
                )}
              />
              {/* Legend can be removed if YAxis labels are clear enough, or kept for color reference */}
              {/* <Legend content={<ChartLegendContent wrapperStyle={{ paddingTop: '10px' }}/>} /> */}
              <Bar dataKey="count" radius={4} maxBarSize={40}>
                {dataByStatus.map((entry) => (
                  <Cell key={`cell-${entry.status}`} fill={entry.fill} name={entry.status} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
