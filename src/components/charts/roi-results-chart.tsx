
"use client";

import type { CalculationResults } from '@/components/calculators/roi-calculator'; // Assuming this path
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid, Line, ReferenceLine } from 'recharts';
import {
  ChartContainer,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface RoiResultsChartProps {
  initialInvestment: number;
  yearlyData: CalculationResults['yearlyData'];
}

const chartConfig = {
  undiscountedCf: {
    label: "Net Cash Flow",
    color: "hsl(var(--chart-1))",
  },
  discountedCf: {
    label: "Discounted CF",
    color: "hsl(var(--chart-2))",
  },
  cumulativeDiscountedCf: {
    label: "Cumulative NPV",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

export function RoiResultsChart({ initialInvestment, yearlyData }: RoiResultsChartProps) {

  if (!yearlyData || yearlyData.length === 0) {
    return (
        <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No data to display chart.
        </div>
    );
  }

  // Determine Y-axis domain to include initial investment and cash flows
  const allValues = [
    -initialInvestment, 
    ...yearlyData.flatMap(d => [d.undiscountedCf, d.discountedCf, d.cumulativeDiscountedCf])
  ];
  const minY = Math.min(...allValues);
  const maxY = Math.max(...allValues);
  const yAxisDomain = [Math.floor(minY / 1000) * 1000, Math.ceil(maxY / 1000) * 1000];


  return (
    <ChartContainer config={chartConfig} className="h-[300px] sm:h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={yearlyData}
          margin={{ top: 5, right: 5, left: -25, bottom: 5 }} // Adjusted margins for better fit
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="year"
            tickFormatter={(value) => `Yr ${value}`}
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickLine={{ stroke: 'hsl(var(--border))' }}
            padding={{ left: 10, right: 10 }}
          />
          <YAxis
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickLine={{ stroke: 'hsl(var(--border))' }}
            domain={yAxisDomain}
            allowDataOverflow={true}
          />
          <Tooltip
            cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
            content={({ active, payload, label }) => (
              active && payload && payload.length ? (
                <div className="bg-popover p-2.5 shadow-lg rounded-md border border-border text-popover-foreground">
                  <p className="label text-xs font-bold mb-1">{`Year ${label}`}</p>
                  {payload.map((entry, index) => (
                    <p key={`item-${index}`} style={{ color: entry.color }} className="text-xs">
                      <span className="font-medium">{`${entry.name}:`}</span>
                      {` $${Number(entry.value).toLocaleString(undefined, {minimumFractionDigits:0, maximumFractionDigits:0})}`}
                    </p>
                  ))}
                   <p className="text-xs mt-1 pt-1 border-t border-border/50">Initial Investment: <span className="font-medium text-red-500">{`-$${initialInvestment.toLocaleString()}`}</span></p>
                </div>
              ) : null
            )}
          />
          <Legend content={<ChartLegendContent wrapperStyle={{ paddingTop: '8px', fontSize: '10px' }} />} />
          <ReferenceLine y={0} stroke="hsl(var(--foreground)/0.5)" strokeDasharray="3 3" />
          <ReferenceLine 
            y={-initialInvestment} 
            label={{ value: "Investment", position: "insideTopRight", fontSize: 9, fill: 'hsl(var(--destructive))', dy: -2, dx: 5 }} 
            stroke="hsl(var(--destructive))" 
            strokeDasharray="4 4" 
            ifOverflow="visible"
          />
          <Bar dataKey="undiscountedCf" fill="var(--color-undiscountedCf)" name="Net CF" radius={[3, 3, 0, 0]} maxBarSize={30} />
          <Bar dataKey="discountedCf" fill="var(--color-discountedCf)" name="Discounted CF" radius={[3, 3, 0, 0]} maxBarSize={30} />
          <Line type="monotone" dataKey="cumulativeDiscountedCf" stroke="var(--color-cumulativeDiscountedCf)" name="Cumulative NPV" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
