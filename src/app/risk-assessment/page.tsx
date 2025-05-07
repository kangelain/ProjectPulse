
'use client';

import type { AssessProjectRiskInput, AssessProjectRiskOutput } from '@/ai/flows/risk-assessment';
import { assessProjectRisk } from '@/ai/flows/risk-assessment';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { ShieldAlert, Lightbulb, CheckCircle2, Loader2, ListChecks, Activity, Briefcase } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { mockProjects, type Project } from '@/lib/mock-data';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils'; // Added import for cn

const MANUAL_ENTRY_VALUE = "__manual_entry__";

const formSchema = z.object({
  selectedProjectId: z.string().optional(),
  projectDescription: z.string().min(50, { message: 'Project description must be at least 50 characters.' }),
  projectTimeline: z.string().min(10, { message: 'Project timeline must be at least 10 characters.' }),
  projectBudget: z.string().min(3, { message: 'Project budget must be at least 3 characters (e.g., $1k).' }),
  teamComposition: z.string().min(10, { message: 'Team composition details must be at least 10 characters.' }),
  historicalData: z.string().optional(),
});

type RiskAssessmentFormValues = z.infer<typeof formSchema>;

const formatDateSafe = (dateString: string | undefined) => {
  if (!dateString) return 'N/A';
  try {
    return format(parseISO(dateString), 'MMM d, yyyy');
  } catch (error) {
    return 'Invalid Date';
  }
};

export default function RiskAssessmentPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState<AssessProjectRiskOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<RiskAssessmentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      selectedProjectId: MANUAL_ENTRY_VALUE, // Default to manual entry
      projectDescription: '',
      projectTimeline: '',
      projectBudget: '',
      teamComposition: '',
      historicalData: '',
    },
  });

  const selectedProjectId = form.watch('selectedProjectId');

  const populateFormWithProjectData = useCallback((projectId: string | undefined) => {
    if (!projectId || projectId === MANUAL_ENTRY_VALUE) {
      const currentManualValues = form.getValues();
      form.reset({
        selectedProjectId: MANUAL_ENTRY_VALUE,
        projectDescription: projectId === MANUAL_ENTRY_VALUE ? '' : currentManualValues.projectDescription,
        projectTimeline: projectId === MANUAL_ENTRY_VALUE ? '' : currentManualValues.projectTimeline,
        projectBudget: projectId === MANUAL_ENTRY_VALUE ? '' : currentManualValues.projectBudget,
        teamComposition: projectId === MANUAL_ENTRY_VALUE ? '' : currentManualValues.teamComposition,
        historicalData: currentManualValues.historicalData || '', 
      });
      return;
    }

    const project = mockProjects.find(p => p.id === projectId);
    if (project) {
      const projectDescription = project.description;
      const projectTimeline = `Project Duration: ${formatDateSafe(project.startDate)} to ${formatDateSafe(project.endDate)}.
Key Milestones:
${project.keyMilestones.map(m => `- ${m.name} (Target: ${formatDateSafe(m.date)}, Status: ${m.status}, Assigned: ${m.assignedTo || 'N/A'})`).join('\n') || 'No key milestones defined.'}
Current project status: ${project.status}.
Completion: ${project.completionPercentage}%.`;
      const projectBudget = `Total Budget: $${project.budget.toLocaleString()}.
Amount Spent: $${project.spent.toLocaleString()}.
Remaining: $${(project.budget - project.spent).toLocaleString()}.
Budget Utilization: ${project.budget > 0 ? ((project.spent / project.budget) * 100).toFixed(1) : 0}%.`;
      const teamComposition = `Team Lead: ${project.teamLead}.
Assigned Team: ${project.assignedUsers && project.assignedUsers.length > 0 ? project.assignedUsers.join(', ') : 'No specific team members assigned.'}.
Portfolio: ${project.portfolio}.
Priority: ${project.priority}.`;

      form.reset({
        selectedProjectId: projectId,
        projectDescription,
        projectTimeline,
        projectBudget,
        teamComposition,
        historicalData: form.getValues('historicalData') || '',
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]); 

  useEffect(() => {
    // Only auto-populate if not manual entry, or if switching away from manual
    if (selectedProjectId !== MANUAL_ENTRY_VALUE) {
        populateFormWithProjectData(selectedProjectId);
    } else {
        // If explicitly set to manual, clear fields if they were previously populated from a project
        // but preserve any existing manual historicalData
        const currentValues = form.getValues();
        if (currentValues.projectDescription && currentValues.projectTimeline && currentValues.projectBudget && currentValues.teamComposition &&
            !mockProjects.find(p => p.description === currentValues.projectDescription) // Heuristic: check if it was from a project
        ) {
          // Don't clear if it already looks like manual entry
        } else if (currentValues.selectedProjectId !== MANUAL_ENTRY_VALUE) { // If it was a project before, then clear
          form.reset({
            selectedProjectId: MANUAL_ENTRY_VALUE,
            projectDescription: '',
            projectTimeline: '',
            projectBudget: '',
            teamComposition: '',
            historicalData: currentValues.historicalData || '',
          });
        }
    }
  }, [selectedProjectId, populateFormWithProjectData, form]);


  async function onSubmit(values: RiskAssessmentFormValues) {
    setIsLoading(true);
    setError(null);
    setAssessmentResult(null);

    const aiInput: AssessProjectRiskInput = {
        projectDescription: values.projectDescription,
        projectTimeline: values.projectTimeline,
        projectBudget: values.projectBudget,
        teamComposition: values.teamComposition,
        historicalData: values.historicalData,
    };

    try {
      const result = await assessProjectRisk(aiInput);
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
            Select an existing project to pre-fill details or enter them manually.
            Our AI will analyze potential risks and suggest mitigation strategies.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6 pt-2">
            <FormField
                control={form.control}
                name="selectedProjectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-muted-foreground" />Select Project (Optional)</FormLabel>
                    <Select 
                        onValueChange={(value) => {
                            field.onChange(value);
                         }} 
                        value={field.value || MANUAL_ENTRY_VALUE} 
                        disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select a project to pre-fill details" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={MANUAL_ENTRY_VALUE}>-- Enter Manually --</SelectItem>
                        {mockProjects.sort((a,b) => a.name.localeCompare(b.name)).map(project => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage id="projectDescription-message" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="projectTimeline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Timeline</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Key milestones, deadlines, current status, and completion percentage..." 
                        rows={4}
                        {...field} 
                        aria-describedby="projectTimeline-message"
                        disabled={isLoading}
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
                    <FormLabel>Project Budget & Financials</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Total budget, amount spent, remaining, and budget utilization..." 
                        rows={3}
                        {...field} 
                        aria-describedby="projectBudget-message"
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage id="projectBudget-message" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="teamComposition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Team Composition & Context</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Team lead, assigned members, portfolio, and project priority..."
                        rows={3}
                        {...field}
                        aria-describedby="teamComposition-message"
                        disabled={isLoading}
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
                        disabled={isLoading}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-end pt-4">
              <Button type="submit" disabled={isLoading || !form.formState.isValid && form.formState.isSubmitted} size="lg">
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
            {selectedProjectId && selectedProjectId !== MANUAL_ENTRY_VALUE && mockProjects.find(p => p.id === selectedProjectId) && (
              <CardDescription>
                Assessment for project: <span className="font-semibold">{mockProjects.find(p => p.id === selectedProjectId)?.name}</span>
              </CardDescription>
            )}
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

