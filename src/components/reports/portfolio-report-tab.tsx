
'use client';

import * as React from 'react'; // Added React import
import type { PortfolioSummary, ProjectStatus } from '@/types/project-reports';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Briefcase } from 'lucide-react';
import { statusStyles, statusIcons } from '@/app/reports/report-style-definitions';

interface PortfolioReportTabProps {
  portfolioSummaries: PortfolioSummary[];
  onViewPortfolioProjects: (summary: PortfolioSummary) => void;
  formatCurrency: (amount: number) => string;
}

export function PortfolioReportTab({
  portfolioSummaries,
  onViewPortfolioProjects,
  formatCurrency,
}: PortfolioReportTabProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {portfolioSummaries.map(summary => (
        <Card key={summary.portfolioName} className="shadow-lg flex flex-col">
          <CardHeader className="pb-2 pt-4 px-4">
             {/* Use flex to align title and count */}
            <div className="flex justify-between items-center">
                <CardTitle className="text-md text-primary truncate mr-2">{summary.portfolioName}</CardTitle>
                <CardDescription className="text-xs shrink-0">{summary.totalProjects} project{summary.totalProjects !== 1 ? 's' : ''}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 flex-grow pt-2 px-4 pb-3 text-xs"> {/* Increased spacing slightly */}
            <div className="pt-1"> {/* Added padding top */}
              <p className="font-medium text-muted-foreground mb-1">Avg. Completion</p> {/* Increased bottom margin */}
              <div className="flex items-center gap-2"> {/* Added gap */}
                <Progress value={summary.averageCompletion} className="h-2 flex-1" indicatorClassName={statusStyles['On Track'].progress} aria-label={`Average completion ${summary.averageCompletion}%`} />
                <span className="font-semibold text-foreground text-sm">{summary.averageCompletion}%</span> {/* Slightly larger text */}
              </div>
            </div>
            <div className="pt-1">
              <p className="font-medium text-muted-foreground mb-1">Financials</p>
              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5"> {/* Use grid for alignment */}
                  <span className="text-muted-foreground/80">Budget:</span>
                  <span className="text-right font-medium text-foreground">{formatCurrency(summary.totalBudget)}</span>
                  <span className="text-muted-foreground/80">Spent:</span>
                  <span className="text-right font-medium text-foreground">{formatCurrency(summary.totalSpent)}</span>
                  <span className="text-muted-foreground/80">Variance:</span>
                  <span className={cn("text-right font-semibold", summary.budgetVariance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
                    {formatCurrency(summary.budgetVariance)}
                  </span>
              </div>
            </div>
            <div className="pt-1">
              <p className="font-medium text-muted-foreground mb-1.5">Status Breakdown</p> {/* Increased margin */}
              <div className="space-y-1">
                {Object.entries(summary.statusCounts).filter(([, count]) => count > 0).length === 0 ? (
                    <p className="text-xs text-muted-foreground italic text-center py-2">No projects with status.</p>
                ) : (
                    Object.entries(summary.statusCounts).map(([status, count]) =>
                    count > 0 ? (
                        <div key={status} className="flex justify-between items-center text-xs">
                        <Badge className={cn('text-[11px] py-0.5 px-1.5 font-medium', (statusStyles[status as ProjectStatus] || statusStyles['Planning']).badge)} variant="outline">
                            {statusIcons[status as ProjectStatus] && React.createElement(statusIcons[status as ProjectStatus], { className: "h-2.5 w-2.5 mr-1" })}
                            {status}
                        </Badge>
                        <span className="text-muted-foreground">{count} project{count > 1 ? 's' : ''}</span>
                        </div>
                    ) : null
                    )
                )}
              </div>
            </div>
           
          </CardContent>
           <div className="px-4 pb-3 pt-1 border-t mt-auto"> {/* Footer area for button */}
             <Button
                variant="link"
                size="sm"
                className="text-xs h-auto p-0 w-full justify-start text-primary hover:text-primary/80"
                onClick={() => onViewPortfolioProjects(summary)}
              >
                View Projects Details...
            </Button>
           </div>
        </Card>
      ))}
      {portfolioSummaries.length === 0 && (
        <Card className="md:col-span-2 lg:col-span-3 shadow-lg">
          <CardContent className="text-center py-12 flex flex-col items-center">
            <Briefcase className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No portfolio data available for current filters.</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Try adjusting or resetting the filters above.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
