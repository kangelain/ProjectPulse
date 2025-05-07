'use server';
/**
 * @fileOverview An AI agent for predicting project performance trends.
 *
 * - predictProjectPerformance - A function that analyzes project data to predict future performance.
 * - PredictProjectPerformanceInput - The input type for the predictProjectPerformance function.
 * - PredictProjectPerformanceOutput - The return type for the predictProjectPerformance function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define a schema for individual portfolio summaries to be passed to the AI
const PortfolioMetricSummarySchema = z.object({
  portfolioName: z.string(),
  totalProjects: z.number(),
  averageCompletion: z.number().describe('Average completion percentage (0-100)'),
  budgetVarianceRatio: z.number().describe('Ratio of total spent to total budget (e.g., 1.1 means 10% over budget, 0.9 means 10% under budget).'),
  onTrackProjects: z.number().describe('Number of projects currently on track.'),
  atRiskProjects: z.number().describe('Number of projects currently at risk.'),
  delayedProjects: z.number().describe('Number of projects currently delayed.'),
});
export type PortfolioMetricSummary = z.infer<typeof PortfolioMetricSummarySchema>;

const PredictProjectPerformanceInputSchema = z.object({
  overallAverageCompletion: z.number().describe('Overall average project completion percentage across all projects.'),
  overallBudgetVarianceRatio: z.number().describe('Overall ratio of total spent to total budget across all projects.'),
  portfolioSummaries: z.array(PortfolioMetricSummarySchema).describe('Summaries for key project portfolios (top 5 if many).'),
  recentTrendIndicators: z.object({
        completionTrend: z.enum(['Improving', 'Declining', 'Stable']).describe('Trend for project completion rates based on simple historical comparison.'),
        budgetTrend: z.enum(['Improving', 'Worsening', 'Stable']).describe('Trend for budget adherence based on simple historical comparison.'),
    }).optional().describe('Optional recent trend indicators based on historical comparison (if available).')
});
export type PredictProjectPerformanceInput = z.infer<typeof PredictProjectPerformanceInputSchema>;

const PredictionSchema = z.object({
    area: z.string().describe('The area of prediction (e.g., Overall, Portfolio X, Budget Management).'),
    prediction: z.string().describe('The textual prediction or insight.'),
    confidence: z.enum(['High', 'Medium', 'Low']).describe('Confidence level in this prediction.'),
    suggestion: z.string().optional().describe('A brief suggestion related to the prediction.'),
});
export type Prediction = z.infer<typeof PredictionSchema>;

const PredictProjectPerformanceOutputSchema = z.object({
  predictions: z.array(PredictionSchema).describe('A list of predictions and insights based on the input data.'),
});
export type PredictProjectPerformanceOutput = z.infer<typeof PredictProjectPerformanceOutputSchema>;

export async function predictProjectPerformance(input: PredictProjectPerformanceInput): Promise<PredictProjectPerformanceOutput> {
  return predictProjectPerformanceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictProjectPerformancePrompt',
  input: {schema: PredictProjectPerformanceInputSchema},
  output: {schema: PredictProjectPerformanceOutputSchema},
  prompt: `You are an expert project analyst specializing in trend analysis and performance forecasting.
Analyze the provided project data to identify potential future trends and predict likely outcomes or challenges.

Overall Metrics:
- Average Completion: {{overallAverageCompletion}}%
- Budget Variance Ratio: {{overallBudgetVarianceRatio}} (1.0 means on budget, >1 over budget, <1 under budget)

{{#if recentTrendIndicators}}
Recent Trends (based on comparing newer vs older projects in the current dataset):
- Completion Trend: {{recentTrendIndicators.completionTrend}}
- Budget Trend: {{recentTrendIndicators.budgetTrend}}
{{else}}
No distinct recent trend indicators available from the current data subset.
{{/if}}

Portfolio Summaries (Top 5 by project count or significance if many provided):
{{#each portfolioSummaries}}
- Portfolio: {{portfolioName}}
  - Total Projects: {{totalProjects}}
  - Avg. Completion: {{averageCompletion}}%
  - Budget Variance Ratio: {{budgetVarianceRatio}}
  - On Track: {{onTrackProjects}}, At Risk: {{atRiskProjects}}, Delayed: {{delayedProjects}}
{{else}}
No specific portfolio summaries provided.
{{/each}}

Based on this data:
1. Provide a high-level overall prediction for future project performance across the board.
2. For each portfolio summary provided (if any), offer a specific prediction or highlight key watch areas. Focus on portfolios showing strong performance, significant risks, or clear trends implied by their current metrics.
3. Identify key areas (e.g., budget management, timeline adherence, specific portfolios) that might face challenges or show improvement based on the input.
4. For each prediction, assign a confidence level (High, Medium, Low) and provide an optional brief suggestion for action.
Structure your output according to the 'predictions' array schema.
Aim for 3-5 key, distinct predictions in total. Ensure predictions are forward-looking and insightful.
Be concise and actionable. If data is sparse or trends are not clear, state that and provide cautious predictions.
`,
});

const predictProjectPerformanceFlow = ai.defineFlow(
  {
    name: 'predictProjectPerformanceFlow',
    inputSchema: PredictProjectPerformanceInputSchema,
    outputSchema: PredictProjectPerformanceOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    // Ensure the output is an array, even if the LLM returns a single object (which it shouldn't based on schema)
    if (output && !Array.isArray(output.predictions)) {
        console.warn("LLM returned non-array for predictions, wrapping in array.");
        // This case should ideally not happen if the LLM respects the output schema.
        // If 'output.predictions' is an object that looks like a single prediction, wrap it.
        // For safety, ensure it has 'area' and 'prediction' to qualify.
        if (typeof output.predictions === 'object' && output.predictions !== null && 'area' in output.predictions && 'prediction' in output.predictions) {
             return { predictions: [output.predictions as Prediction] };
        }
        // If it's something else, return empty or handle error
        return { predictions: [] };
    }
    return output! ;
  }
);
