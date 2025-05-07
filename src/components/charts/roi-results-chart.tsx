
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
  // Add padding to the domain
  const yPadding = (maxY - minY) * 0.1 || Math.abs(minY * 0.2) || Math.abs(maxY * 0.2) || 1000; // Adjust padding logic
  const yAxisDomain: [number, number] = [
    Math.floor((minY - yPadding) / 1000) * 1000, // Round down
    Math.ceil((maxY + yPadding) / 1000) * 1000   // Round up
  ];


  return (
    <ChartContainer config={chartConfig} className="h-full w-full"> {/* Use full height from parent */}
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={yearlyData}
          margin={{ top: 5, right: 5, left: -20, bottom: 5 }} // Adjusted margins for better fit
          barCategoryGap="20%" // Adjusted gap between categories
          barGap={4} // Gap between bars within a category
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border)/0.5)" />
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
            allowDataOverflow={true} // Allow lines/bars outside domain if needed
            width={55} // Adjusted width for Y-axis labels
          />
          <Tooltip
            cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
            content={({ active, payload, label }) => (
              active && payload && payload.length ? (
                <div className="bg-popover p-2 shadow-lg rounded-md border border-border text-popover-foreground text-xs"> {/* Adjusted padding */}
                  <p className="label font-semibold mb-1">{`Year ${label}`}</p>
                  {payload.map((entry, index) => (
                    <p key={`item-${index}`} style={{ color: entry.color }}>
                      <span className="font-medium">{`${entry.name}:`}</span>
                      {` $${Number(entry.value).toLocaleString(undefined, {minimumFractionDigits:0, maximumFractionDigits:0})}`}
                    </p>
                  ))}
                   <p className="mt-1 pt-1 border-t border-border/50">Initial Investment: <span className="font-medium text-destructive">{`-$${initialInvestment.toLocaleString()}`}</span></p>
                </div>
              ) : null
            )}
          />
          {/* Adjusted legend styling */}
          <Legend content={<ChartLegendContent wrapperStyle={{ paddingTop: '8px', fontSize: '10px', paddingLeft: '25px' }} />} verticalAlign="top" align="right" height={30} />
          <ReferenceLine y={0} stroke="hsl(var(--foreground)/0.5)" strokeDasharray="3 3" />
          <ReferenceLine
            y={-initialInvestment}
            label={{ value: "Investment", position: "insideTopLeft", fontSize: 9, fill: 'hsl(var(--destructive))', dy: -2, dx: 2 }}
            stroke="hsl(var(--destructive))"
            strokeDasharray="4 4"
            ifOverflow="visible"
          />
          <Bar dataKey="undiscountedCf" fill="var(--color-undiscountedCf)" name="Net CF" radius={[3, 3, 0, 0]} maxBarSize={40} /> {/* Adjusted maxBarSize */}
          <Bar dataKey="discountedCf" fill="var(--color-discountedCf)" name="Discounted CF" radius={[3, 3, 0, 0]} maxBarSize={40} /> {/* Adjusted maxBarSize */}
          <Line type="monotone" dataKey="cumulativeDiscountedCf" stroke="var(--color-cumulativeDiscountedCf)" name="Cumulative NPV" strokeWidth={2} dot={{ r: 3, fill: 'var(--color-cumulativeDiscountedCf)' }} activeDot={{ r: 5, stroke: 'var(--background)', strokeWidth: 1, fill: 'var(--color-cumulativeDiscountedCf)' }} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
