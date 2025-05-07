
"use client";

import type { Project } from '@/types/project';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ProjectBudgetChartProps {
  projects: Project[];
}

const chartConfig = {
  budget: {
    label: "Budget",
    color: "hsl(var(--chart-1))", // Teal variant for budget
  },
  spent: {
    label: "Spent",
    color: "hsl(var(--chart-2))", // Orange variant for spent
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
      <Card>
        <CardHeader>
          <CardTitle>Budget Utilization</CardTitle>
          <CardDescription>No project data available to display chart.</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <p className="text-muted-foreground">No data for selected portfolio.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Budget Utilization Overview</CardTitle>
        <CardDescription>Comparison of budgeted vs. spent amounts for projects.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 75 }} 
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                angle={-45} 
                textAnchor="end"
                interval={0} 
                height={100} 
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} 
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={{ stroke: 'hsl(var(--border))' }}
              />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted)/0.3)'}}
                content={({ active, payload, label }) => (
                  active && payload && payload.length ? (
                    <div className="bg-background p-2 shadow-lg rounded-md border border-border">
                      <p className="label text-sm font-bold text-foreground">{`${label}`}</p>
                      {payload.map((entry, index) => (
                        <p key={`item-${index}`} style={{ color: entry.color }} className="text-xs">
                          {`${entry.name}: $${Number(entry.value).toLocaleString()}`}
                        </p>
                      ))}
                    </div>
                  ) : null
                )}
              />
              <Legend content={<ChartLegendContent />} />
              <Bar dataKey="budget" fill="var(--color-budget)" name="Budget" radius={[4, 4, 0, 0]} />
              <Bar dataKey="spent" fill="var(--color-spent)" name="Spent" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
