
"use client";

import type { Project } from '@/types/project';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import {
  ChartContainer,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase } from 'lucide-react';

interface ProjectBudgetChartProps {
  projects: Project[];
}

const chartConfig = {
  budget: {
    label: "Budget",
    color: "hsl(var(--chart-1))", 
  },
  spent: {
    label: "Spent",
    color: "hsl(var(--chart-2))", 
  },
} satisfies ChartConfig;

export function ProjectBudgetChart({ projects }: ProjectBudgetChartProps) {
  const chartData = projects.map(project => ({
    name: project.name,
    budget: project.budget,
    spent: project.spent,
  }));

  if (!projects.length || chartData.length === 0) {
    return (
      <Card className="shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl">Budget Utilization</CardTitle>
          <CardDescription>No project data available to display chart.</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] flex flex-col items-center justify-center text-center p-6">
          <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-lg">No Budget Data</p>
          <p className="text-sm text-muted-foreground">There are no projects with budget information in the current selection.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl">Budget Utilization Overview</CardTitle>
        <CardDescription>Comparison of budgeted vs. spent amounts for projects.</CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        <ChartContainer config={chartConfig} className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 10, left: 0, bottom: chartData.length > 3 ? 90 : 20 }} 
              barGap={4} // Add gap between bars of the same group
              barCategoryGap="20%" // Add gap between categories
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                angle={chartData.length > 3 ? -40 : 0} 
                textAnchor={chartData.length > 3 ? "end" : "middle"}
                interval={0} 
                height={chartData.length > 3 ? 100 : 30} 
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} 
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={{ stroke: 'hsl(var(--border))' }}
                width={50}
              />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted)/0.3)'}}
                content={({ active, payload, label }) => (
                  active && payload && payload.length ? (
                    <div className="bg-popover p-3 shadow-lg rounded-md border border-border text-popover-foreground">
                      <p className="label text-sm font-bold mb-1.5">{`${label}`}</p>
                      {payload.map((entry, index) => (
                        <p key={`item-${index}`} style={{ color: entry.color }} className="text-xs">
                          <span className="font-medium">{`${entry.name}:`}</span>
                          {` $${Number(entry.value).toLocaleString()}`}
                        </p>
                      ))}
                    </div>
                  ) : null
                )}
              />
              <Legend content={<ChartLegendContent wrapperStyle={{ paddingTop: '10px' }} />} />
              <Bar dataKey="budget" fill="var(--color-budget)" name="Budget" radius={[4, 4, 0, 0]} maxBarSize={50} />
              <Bar dataKey="spent" fill="var(--color-spent)" name="Spent" radius={[4, 4, 0, 0]} maxBarSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
