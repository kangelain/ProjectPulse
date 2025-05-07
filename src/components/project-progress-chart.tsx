"use client";

import type { Project, ProjectStatus } from '@/types/project';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ProjectProgressChartProps {
  projects: Project[];
}

const chartConfig = {
  count: {
    label: "Projects",
  },
  "On Track": {
    label: "On Track",
    color: "hsl(var(--chart-1))", // Teal variant
  },
  "At Risk": {
    label: "At Risk",
    color: "hsl(var(--chart-2))", // Orange variant
  },
  "Delayed": {
    label: "Delayed",
    color: "hsl(var(--chart-4))", // Lighter Teal (or a yellow/amber)
  },
  "Completed": {
    label: "Completed",
    color: "hsl(var(--chart-3))", // Blue variant
  },
  "Planning": {
    label: "Planning",
    color: "hsl(var(--chart-5))", // Lighter Orange (or a gray)
  },
} satisfies ChartConfig;


export function ProjectProgressChart({ projects }: ProjectProgressChartProps) {
  const dataByStatus = (Object.keys(chartConfig) as Array<keyof typeof chartConfig>)
    .filter(key => key !== 'count') // Exclude the generic 'count' label
    .map(status => ({
      status: status as ProjectStatus | string, // Cast because chartConfig keys are broader
      count: projects.filter(p => p.status === status).length,
    }))
    .filter(item => item.count > 0); // Only include statuses with projects

  if (!projects.length || !dataByStatus.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Project Status Overview</CardTitle>
          <CardDescription>No project data available to display chart.</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">No data</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Project Status Overview</CardTitle>
        <CardDescription>Distribution of projects by their current status.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={dataByStatus}
              layout="vertical"
              margin={{ left: 10, right: 30, top: 5, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" dataKey="count" allowDecimals={false} />
              <YAxis
                dataKey="status"
                type="category"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={80}
              />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted))' }}
                content={<ChartTooltipContent hideLabel />}
              />
              <Legend content={<ChartLegendContent />} />
              <Bar dataKey="count" radius={5}>
                {dataByStatus.map((entry) => (
                  <Bar
                    key={entry.status}
                    dataKey="count" // This seems redundant, recharts handles this
                    fill={chartConfig[entry.status as keyof typeof chartConfig]?.color || "hsl(var(--muted))"}
                    name={entry.status}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
