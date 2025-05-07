'use client';

import type { PredictProjectPerformanceOutput } from '@/ai/flows/predict-project-performance-flow';
import type { TrendIndicator } from '@/types/project-reports';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle as ShadcnAlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { Brain, CheckCircle2, HelpCircle, TrendingUp, Loader2, AlertTriangle, LineChart as LineChartIcon, TrendingDown } from 'lucide-react';
import { ReactNode } from 'react';

interface TrendsReportTabProps {
  filteredProjectCount: number;
  calculatedTrendIndicators: TrendIndicator[];
  trendsAndPredictions: PredictProjectPerformanceOutput | null;
  isLoadingTrendsAndPredictions: boolean;
  trendsError: string | null;
  onRefreshPredictions: () => void;
}

export function TrendsReportTab({
  filteredProjectCount,
  calculatedTrendIndicators,
  trendsAndPredictions,
  isLoadingTrendsAndPredictions,
  trendsError,
  onRefreshPredictions,
}: TrendsReportTabProps) {

  const getConfidenceIcon = (confidence: 'High' | 'Medium' | 'Low'): ReactNode => {
    switch (confidence) {
      case 'High': return <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />;
      case 'Medium': return <TrendingUp className="h-3.5 w-3.5 mr-1.5" />;
      case 'Low': return <HelpCircle className="h-3.5 w-3.5 mr-1.5" />;
      default: return null;
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center">
              <Brain className="mr-2 h-5 w-5 text-primary" /> Trends &amp; AI Predictions
            </CardTitle>
            <CardDescription className="text-xs">
              Identify patterns and predict future performance with AI analysis.
              Results are based on the currently filtered project data.
            </CardDescription>
          </div>
          <Button onClick={onRefreshPredictions} disabled={isLoadingTrendsAndPredictions || filteredProjectCount === 0} size="sm" className="h-9 px-3 text-xs">
            {isLoadingTrendsAndPredictions ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Brain className="mr-1.5 h-3.5 w-3.5" />}
            {isLoadingTrendsAndPredictions ? 'Analyzing...' : 'Re-analyze with AI'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-2 px-4 pb-4 space-y-5">
        {filteredProjectCount === 0 && (
          <Alert variant="default" className="border-yellow-400 text-yellow-700 dark:border-yellow-500 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 p-3">
            <HelpCircle className="h-4 w-4 !text-yellow-600 dark:!text-yellow-400" />
            <ShadcnAlertTitle className="font-semibold text-sm">No Data for Analysis</ShadcnAlertTitle>
            <AlertDescription className="text-xs">
              There are no projects matching the current filters. Please adjust your filters to enable trend analysis and AI predictions.
            </AlertDescription>
          </Alert>
        )}
        {filteredProjectCount > 0 && (
          <>
            <Card>
              <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="text-md flex items-center">
                  <LineChartIcon className="mr-2 h-4 w-4 text-accent" /> Calculated Trend Indicators
                </CardTitle>
                <CardDescription className="text-xs">Basic trends based on comparing older vs. newer projects in the current filtered dataset.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 px-3 pb-3">
                {calculatedTrendIndicators.length === 0 && !isLoadingTrendsAndPredictions && <p className="text-xs text-muted-foreground col-span-full text-center py-3">Not enough distinct project start dates in the filtered set to calculate trends. Try broader filters.</p>}
                {calculatedTrendIndicators.map((indicator, idx) => (
                  <Card key={idx} className="bg-secondary/40 shadow-sm">
                    <CardHeader className="p-3 pb-1.5">
                      <CardTitle className="text-sm">{indicator.metricName}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 text-xs">
                      <p>Current: <span className="font-semibold">{indicator.currentValue}</span></p>
                      <p className={cn(
                        indicator.trend === 'Improving' && "text-green-600 dark:text-green-400",
                        indicator.trend === 'Declining' && "text-red-600 dark:text-red-400",
                         indicator.trend === 'Worsening' && "text-red-600 dark:text-red-400", // Added Worsening
                        indicator.trend === 'Stable' && "text-muted-foreground"
                      )}>
                        Trend: {indicator.trendDescription}
                        {indicator.trend === 'Improving' && <TrendingUp className="inline ml-1 h-3.5 w-3.5" />}
                        {(indicator.trend === 'Declining' || indicator.trend === 'Worsening') && <TrendingDown className="inline ml-1 h-3.5 w-3.5" />}
                      </p>
                      {indicator.historicalComparison && <p className="text-xs text-muted-foreground">({indicator.historicalComparison})</p>}
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="text-md flex items-center">
                  <Brain className="mr-2 h-4 w-4 text-accent" /> AI-Powered Predictions
                </CardTitle>
                <CardDescription className="text-xs">Insights generated by AI based on the current filtered data. Confidence: High, Medium, Low.</CardDescription>
              </CardHeader>
              <CardContent className="pt-2 px-3 pb-3">
                {isLoadingTrendsAndPredictions && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary mr-2.5" />
                    <p className="text-muted-foreground text-sm">AI is analyzing data and generating predictions...</p>
                  </div>
                )}
                {trendsError && !isLoadingTrendsAndPredictions && (
                  <Alert variant="destructive" className="p-3">
                    <AlertTriangle className="h-4 w-4" />
                    <ShadcnAlertTitle className="text-sm font-semibold">Error Generating Predictions</ShadcnAlertTitle>
                    <AlertDescription className="text-xs">{trendsError}</AlertDescription>
                  </Alert>
                )}
                {!isLoadingTrendsAndPredictions && !trendsError && trendsAndPredictions && trendsAndPredictions.predictions.length > 0 && (
                  <div className="space-y-3">
                    {trendsAndPredictions.predictions.map((pred, idx) => (
                      <Alert key={idx} variant={'default'}
                        className={cn(
                          "border-l-4 p-3",
                          pred.confidence === 'High' && "border-green-500 bg-green-50 dark:bg-green-900/20",
                          pred.confidence === 'Medium' && "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20",
                          pred.confidence === 'Low' && "border-gray-400 bg-gray-50 dark:bg-gray-700/20"
                        )}
                      >
                        <div className={cn("flex items-center font-semibold mb-0.5 text-xs",
                          pred.confidence === 'High' && "text-green-700 dark:text-green-300",
                          pred.confidence === 'Medium' && "text-yellow-700 dark:text-yellow-400",
                          pred.confidence === 'Low' && "text-gray-600 dark:text-gray-300"
                        )}>
                          {getConfidenceIcon(pred.confidence)}
                          {pred.area}: <span className="ml-1 font-normal text-foreground">{pred.prediction}</span>
                        </div>
                        {pred.suggestion && <AlertDescription className="text-xs text-muted-foreground pl-5">{pred.suggestion}</AlertDescription>}
                      </Alert>
                    ))}
                  </div >
                )}
                {!isLoadingTrendsAndPredictions && !trendsError && (!trendsAndPredictions || trendsAndPredictions.predictions.length === 0) && (
                  <p className="text-xs text-muted-foreground text-center py-4">No specific AI predictions generated for the current data. The AI might need more distinct data or clearer trends.</p>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </CardContent>
    </Card>
  );
}
