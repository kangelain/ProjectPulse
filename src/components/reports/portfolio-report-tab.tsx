'use client';

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
            <CardTitle className="text-md text-primary">{summary.portfolioName}</CardTitle>
            <CardDescription className="text-xs">{summary.totalProjects} project{summary.totalProjects !== 1 ? 's' : ''}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5 flex-grow pt-2 px-4 pb-3 text-xs">
            <div>
              <p className="font-medium text-muted-foreground mb-0.5">Avg. Completion</p>
              <div className="flex items-center">
                <Progress value={summary.averageCompletion} className="h-2 mr-2 flex-1" indicatorClassName={statusStyles['On Track'].progress} aria-label={`Average completion ${summary.averageCompletion}%`} />
                <span className="font-semibold text-foreground">{summary.averageCompletion}%</span>
              </div>
            </div>
            <div>
              <p className="font-medium text-muted-foreground mb-0.5">Financials</p>
              <p className="text-xs text-muted-foreground/80">Budget: {formatCurrency(summary.totalBudget)}</p>
              <p className="text-xs text-muted-foreground/80">Spent: {formatCurrency(summary.totalSpent)}</p>
              <p className={cn("text-xs font-semibold", summary.budgetVariance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
                Variance: {formatCurrency(summary.budgetVariance)}
              </p>
            </div>
            <div>
              <p className="font-medium text-muted-foreground mb-1">Status Breakdown</p>
              <div className="space-y-1">
                {Object.entries(summary.statusCounts).map(([status, count]) =>
                  count > 0 ? (
                    <div key={status} className="flex justify-between items-center text-xs">
                      <Badge className={cn('text-xs py-0.5 px-1.5 font-normal', (statusStyles[status as ProjectStatus] || statusStyles['Planning']).badge)} variant="outline">
                        {statusIcons[status as ProjectStatus] && React.createElement(statusIcons[status as ProjectStatus], { className: "h-2.5 w-2.5 mr-1" })}
                        {status}
                      </Badge>
                      <span className="text-muted-foreground">{count} project{count > 1 ? 's' : ''}</span>
                    </div>
                  ) : null
                )}
              </div>
            </div>
            <Button
              variant="link"
              size="sm"
              className="text-xs h-auto p-0 mt-1.5 text-primary hover:text-primary/80"
              onClick={() => onViewPortfolioProjects(summary)}
            >
              View Projects in Portfolio
            </Button>
          </CardContent>
        </Card>
      ))}
      {portfolioSummaries.length === 0 && (
        <Card className="md:col-span-2 lg:col-span-3 shadow-lg">
          <CardContent className="text-center py-12">
            <Briefcase className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            No portfolio data available for current filters.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
