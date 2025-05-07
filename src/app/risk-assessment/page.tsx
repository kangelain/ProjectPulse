'use client';

import type { AssessProjectRiskInput, AssessProjectRiskOutput } from '@/ai/flows/risk-assessment';
import { assessProjectRisk } from '@/ai/flows/risk-assessment';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { ShieldAlert, Lightbulb, CheckCircle2, Loader2, ListChecks, Activity } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const formSchema = z.object({
  projectDescription: z.string().min(50, { message: 'Project description must be at least 50 characters.' }),
  projectTimeline: z.string().min(10, { message: 'Project timeline must be at least 10 characters.' }),
  projectBudget: z.string().min(3, { message: 'Project budget must be at least 3 characters (e.g., $1k).' }),
  teamComposition: z.string().min(10, { message: 'Team composition details must be at least 10 characters.' }),
  historicalData: z.string().optional(),
});

type RiskAssessmentFormValues = z.infer<typeof formSchema>;

export default function RiskAssessmentPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState<AssessProjectRiskOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<RiskAssessmentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectDescription: '',
      projectTimeline: '',
      projectBudget: '',
      teamComposition: '',
      historicalData: '',
    },
  });

  async function onSubmit(values: RiskAssessmentFormValues) {
    setIsLoading(true);
    setError(null);
    setAssessmentResult(null);
    try {
      const result = await assessProjectRisk(values as AssessProjectRiskInput);
      setAssessmentResult(result);
      toast({
        title: 'Risk Assessment Complete',
        description: 'AI analysis has finished.',
        variant: 'default',
      });
    } catch (err) {
      console.error('Risk assessment failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: `Risk assessment failed: ${errorMessage}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }
  
  const getRiskScoreColor = (score: number) => {
    if (score <= 33) return 'bg-green-500'; 
    if (score <= 66) return 'bg-yellow-500'; 
    return 'bg-red-500'; 
  };

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center mb-8">
        <ShieldAlert className="h-8 w-8 mr-3 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          AI-Powered Project Risk Assessment
        </h1>
      </div>
      <Card className="shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl">Analyze Project Risks</CardTitle>
          <CardDescription>
            Provide project details below. Our AI will analyze potential risks and suggest mitigation strategies.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6 pt-2">
              <FormField
                control={form.control}
                name="projectDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Detailed description of the project, including goals, tasks, and resources..."
                        rows={5}
                        {...field}
                        aria-describedby="projectDescription-message"
                      />
                    </FormControl>
                    <FormMessage id="projectDescription-message" />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="projectTimeline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Timeline</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Key milestones and deadlines (e.g., Q1: Design, Q2: Dev)" 
                          {...field} 
                          aria-describedby="projectTimeline-message"
                        />
                      </FormControl>
                      <FormMessage id="projectTimeline-message" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="projectBudget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Budget</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Financial resources (e.g., $500,000, 10 sprints)" 
                          {...field} 
                          aria-describedby="projectBudget-message"
                        />
                      </FormControl>
                      <FormMessage id="projectBudget-message" />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="teamComposition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Team Composition</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Information about the project team, roles, and experience..."
                        rows={3}
                        {...field}
                        aria-describedby="teamComposition-message"
                      />
                    </FormControl>
                    <FormMessage id="teamComposition-message" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="historicalData"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Historical Data (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Relevant data from similar past projects, if available..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-end pt-4">
              <Button type="submit" disabled={isLoading} size="lg">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Analyzing Risks...
                  </>
                ) : (
                  <>
                    <Lightbulb className="mr-2 h-5 w-5" />
                    Assess Project Risks
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      {error && (
        <Alert variant="destructive" className="mt-8">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Assessment Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {assessmentResult && (
        <Card className="mt-8 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-2xl">
              <CheckCircle2 className="h-7 w-7 mr-3 text-green-500" />
              Risk Assessment Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-2">
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center">
                <Activity className="h-5 w-5 mr-2 text-accent" />
                 Overall Risk Score: 
                <span className={cn("ml-2 px-2 py-0.5 rounded text-sm text-white", getRiskScoreColor(assessmentResult.overallRiskScore))}>
                   {assessmentResult.overallRiskScore} / 100
                </span>
              </h3>
              <Progress 
                value={assessmentResult.overallRiskScore} 
                className="h-3" 
                indicatorClassName={getRiskScoreColor(assessmentResult.overallRiskScore)}
                aria-label={`Overall risk score: ${assessmentResult.overallRiskScore} out of 100`}
              />
               <p className="text-sm text-muted-foreground mt-1.5">
                Interpretation: {assessmentResult.overallRiskScore <= 33 ? "Low Risk" : assessmentResult.overallRiskScore <= 66 ? "Medium Risk" : "High Risk"}
              </p>
            </div>

            <div className="p-4 bg-secondary/40 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-2 flex items-center">
                <ListChecks className="h-5 w-5 mr-2 text-accent" />
                Identified Risks
              </h3>
              {assessmentResult.identifiedRisks.length > 0 ? (
                <ul className="list-disc list-inside space-y-1.5 pl-2">
                  {assessmentResult.identifiedRisks.map((risk, index) => (
                    <li key={`risk-${index}`} className="text-sm text-foreground">{risk}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No specific risks identified by the AI.</p>
              )}
            </div>

            <div className="p-4 bg-secondary/40 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-2 flex items-center">
                <Lightbulb className="h-5 w-5 mr-2 text-accent" />
                Mitigation Recommendations
              </h3>
               {assessmentResult.riskMitigationRecommendations.length > 0 ? (
                <ul className="list-disc list-inside space-y-1.5 pl-2">
                  {assessmentResult.riskMitigationRecommendations.map((rec, index) => (
                    <li key={`rec-${index}`} className="text-sm text-foreground">{rec}</li>
                  ))}
                </ul>
              ) : (
                 <p className="text-sm text-muted-foreground">No specific mitigation recommendations provided by the AI.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
