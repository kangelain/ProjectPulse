'use server';
/**
 * @fileOverview An AI agent for project risk assessment.
 *
 * - assessProjectRisk - A function that assesses project risks and provides mitigation recommendations.
 * - AssessProjectRiskInput - The input type for the assessProjectRisk function.
 * - AssessProjectRiskOutput - The return type for the assessProjectRisk function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AssessProjectRiskInputSchema = z.object({
  projectDescription: z
    .string()
    .describe('Detailed description of the project, including goals, tasks, and resources.'),
  projectTimeline: z.string().describe('Project timeline with key milestones and deadlines.'),
  projectBudget: z.string().describe('Project budget and financial resources allocation.'),
  teamComposition: z.string().describe('Information about the project team and their roles.'),
  historicalData: z
    .string()
    .optional()
    .describe('Relevant historical data from similar projects, if available.'),
});
export type AssessProjectRiskInput = z.infer<typeof AssessProjectRiskInputSchema>;

const AssessProjectRiskOutputSchema = z.object({
  identifiedRisks: z
    .array(z.string())
    .describe('List of identified potential risks for the project.'),
  riskMitigationRecommendations:
    z.array(z.string()).describe('Recommended actions to mitigate identified risks.'),
  overallRiskScore: z
    .number()
    .min(0).max(100) // Added min/max validation
    .describe('An overall risk score for the project, from 0 (low risk) to 100 (high risk).'),
});
export type AssessProjectRiskOutput = z.infer<typeof AssessProjectRiskOutputSchema>;

export async function assessProjectRisk(input: AssessProjectRiskInput): Promise<AssessProjectRiskOutput> {
  return assessProjectRiskFlow(input);
}

const prompt = ai.definePrompt({
  name: 'assessProjectRiskPrompt',
  input: {schema: AssessProjectRiskInputSchema},
  output: {schema: AssessProjectRiskOutputSchema},
  prompt: `You are an expert project risk analyst. Analyze the following project data to identify potential risks, provide mitigation recommendations, and assign an overall risk score.

Project Description: {{{projectDescription}}}
Project Timeline: {{{projectTimeline}}}
Project Budget: {{{projectBudget}}}
Team Composition: {{{teamComposition}}}
Historical Data (if available): {{{historicalData}}}

Based on this information, identify potential risks, suggest mitigation strategies, and provide an overall risk score from 0 to 100. Ensure the identified risks and mitigation recommendations are actionable and specific.
Provide the output strictly adhering to the defined JSON schema, including an 'overallRiskScore' between 0 and 100.
`,
});

const assessProjectRiskFlow = ai.defineFlow(
  {
    name: 'assessProjectRiskFlow',
    inputSchema: AssessProjectRiskInputSchema,
    outputSchema: AssessProjectRiskOutputSchema,
  },
  async input => {
    const response = await prompt(input);
    const output = response?.output; // Safely access output

    if (!output) {
      // Log the issue and throw a specific error
      console.error('AI risk assessment flow did not return a valid output.', { input });
      throw new Error('AI failed to generate risk assessment. The response was empty.');
    }

    // Additional validation to ensure the output matches the schema, especially the score range
    try {
      const validatedOutput = AssessProjectRiskOutputSchema.parse(output);
      return validatedOutput;
    } catch (validationError) {
       console.error('AI risk assessment flow returned invalid data:', output, validationError);
       throw new Error('AI returned an invalid risk assessment format.');
    }
  }
);