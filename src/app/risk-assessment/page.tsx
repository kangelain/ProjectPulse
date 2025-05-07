
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
import { cn } from '@/lib/utils';

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
      selectedProjectId: MANUAL_ENTRY_VALUE, 
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
  }, [form]); 

  useEffect(() => {
    if (selectedProjectId !== MANUAL_ENTRY_VALUE) {
        populateFormWithProjectData(selectedProjectId);
    } else {
        const currentValues = form.getValues();
        if (currentValues.projectDescription && currentValues.projectTimeline && currentValues.projectBudget && currentValues.teamComposition &&
            !mockProjects.find(p => p.description === currentValues.projectDescription) 
        ) {
        } else if (currentValues.selectedProjectId !== MANUAL_ENTRY_VALUE) { 
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
    <div className="container mx-auto py-8"> {/* Standardized container padding */}
      <div className="flex items-center mb-6"> {/* Reduced bottom margin */}
        <ShieldAlert className="h-7 w-7 mr-2.5 text-primary" /> {/* Adjusted icon size and margin */}
        <h1 className="text-2xl font-semibold tracking-tight text-foreground"> {/* Adjusted font size */}
          AI-Powered Project Risk Assessment
        </h1>
      </div>
      <Card className="shadow-lg"> {/* Consistent shadow */}
        <CardHeader className="pb-4 pt-5 px-5"> {/* Adjusted padding */}
          <CardTitle className="text-xl">Analyze Project Risks</CardTitle> {/* Adjusted title size */}
          <CardDescription className="text-sm">
            Select an existing project to pre-fill details or enter them manually.
            Our AI will analyze potential risks and suggest mitigation strategies.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-5 pt-2 px-5"> {/* Adjusted spacing and padding */}
            <FormField
                control={form.control}
                name="selectedProjectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5 text-muted-foreground" />Select Project (Optional)</FormLabel> {/* Smaller label */}
                    <Select 
                        onValueChange={(value) => {
                            field.onChange(value);
                         }} 
                        value={field.value || MANUAL_ENTRY_VALUE} 
                        disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger className="h-10 text-sm"> {/* Consistent height and text size */}
                          <SelectValue placeholder="Select a project to pre-fill details" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={MANUAL_ENTRY_VALUE}>-- Enter Manually --</SelectItem>
                        {mockProjects.sort((a,b) => a.name.localeCompare(b.name)).map(project => (
                          <SelectItem key={project.id} value={project.id} className="text-sm">
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
                    <FormLabel className="text-xs font-medium">Project Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Detailed description of the project, including goals, tasks, and resources..."
                        rows={4} // Reduced rows
                        {...field}
                        aria-describedby="projectDescription-message"
                        disabled={isLoading}
                        className="text-sm"
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
                    <FormLabel className="text-xs font-medium">Project Timeline</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Key milestones, deadlines, current status, and completion percentage..." 
                        rows={3} // Reduced rows
                        {...field} 
                        aria-describedby="projectTimeline-message"
                        disabled={isLoading}
                        className="text-sm"
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
                    <FormLabel className="text-xs font-medium">Project Budget & Financials</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Total budget, amount spent, remaining, and budget utilization..." 
                        rows={2} // Reduced rows
                        {...field} 
                        aria-describedby="projectBudget-message"
                        disabled={isLoading}
                        className="text-sm"
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
                    <FormLabel className="text-xs font-medium">Team Composition & Context</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Team lead, assigned members, portfolio, and project priority..."
                        rows={2} // Reduced rows
                        {...field}
                        aria-describedby="teamComposition-message"
                        disabled={isLoading}
                        className="text-sm"
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
                    <FormLabel className="text-xs font-medium">Historical Data (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Relevant data from similar past projects, if available..."
                        rows={2} // Reduced rows
                        {...field}
                        disabled={isLoading}
                        className="text-sm"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-end pt-4 pb-5 px-5"> {/* Adjusted padding */}
              <Button type="submit" disabled={isLoading || !form.formState.isValid && form.formState.isSubmitted} size="default" className="h-10 text-sm font-semibold"> {/* Consistent height and text */}
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing Risks...
                  </>
                ) : (
                  <>
                    <Lightbulb className="mr-2 h-4 w-4" />
                    Assess Project Risks
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      {error && (
        <Alert variant="destructive" className="mt-6"> {/* Adjusted margin */}
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle className="text-sm font-semibold">Assessment Error</AlertTitle> {/* Adjusted text size */}
          <AlertDescription className="text-xs">{error}</AlertDescription> {/* Adjusted text size */}
        </Alert>
      )}

      {assessmentResult && (
        <Card className="mt-6 shadow-lg"> {/* Adjusted margin */}
          <CardHeader className="pb-3 pt-4 px-5"> {/* Adjusted padding */}
            <CardTitle className="flex items-center text-xl"> {/* Adjusted text size */}
              <CheckCircle2 className="h-6 w-6 mr-2.5 text-green-500" /> {/* Adjusted icon size and margin */}
              Risk Assessment Results
            </CardTitle>
            {selectedProjectId && selectedProjectId !== MANUAL_ENTRY_VALUE && mockProjects.find(p => p.id === selectedProjectId) && (
              <CardDescription className="text-sm">
                Assessment for project: <span className="font-semibold">{mockProjects.find(p => p.id === selectedProjectId)?.name}</span>
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-5 pt-2 px-5 pb-5"> {/* Adjusted spacing and padding */}
            <div>
              <h3 className="text-md font-semibold mb-1.5 flex items-center"> {/* Adjusted text size and margin */}
                <Activity className="h-4 w-4 mr-2 text-accent" />
                 Overall Risk Score: 
                <span className={cn("ml-2 px-2 py-0.5 rounded text-xs text-white", getRiskScoreColor(assessmentResult.overallRiskScore))}> {/* Adjusted text size */}
                   {assessmentResult.overallRiskScore} / 100
                </span>
              </h3>
              <Progress 
                value={assessmentResult.overallRiskScore} 
                className="h-2.5"  // Slimmer progress bar
                indicatorClassName={getRiskScoreColor(assessmentResult.overallRiskScore)}
                aria-label={`Overall risk score: ${assessmentResult.overallRiskScore} out of 100`}
              />
               <p className="text-xs text-muted-foreground mt-1"> {/* Adjusted text size and margin */}
                Interpretation: {assessmentResult.overallRiskScore <= 33 ? "Low Risk" : assessmentResult.overallRiskScore <= 66 ? "Medium Risk" : "High Risk"}
              </p>
            </div>

            <div className="p-3 bg-secondary/40 rounded-md shadow-xs"> {/* Adjusted padding and shadow */}
              <h3 className="text-md font-semibold mb-1.5 flex items-center">
                <ListChecks className="h-4 w-4 mr-2 text-accent" />
                Identified Risks
              </h3>
              {assessmentResult.identifiedRisks.length > 0 ? (
                <ul className="list-disc list-inside space-y-1 pl-2"> {/* Adjusted spacing */}
                  {assessmentResult.identifiedRisks.map((risk, index) => (
                    <li key={`risk-${index}`} className="text-xs text-foreground">{risk}</li> {/* Adjusted text size */}
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">No specific risks identified by the AI.</p>
              )}
            </div>

            <div className="p-3 bg-secondary/40 rounded-md shadow-xs">
              <h3 className="text-md font-semibold mb-1.5 flex items-center">
                <Lightbulb className="h-4 w-4 mr-2 text-accent" />
                Mitigation Recommendations
              </h3>
               {assessmentResult.riskMitigationRecommendations.length > 0 ? (
                <ul className="list-disc list-inside space-y-1 pl-2">
                  {assessmentResult.riskMitigationRecommendations.map((rec, index) => (
                    <li key={`rec-${index}`} className="text-xs text-foreground">{rec}</li>
                  ))}
                </ul>
              ) : (
                 <p className="text-xs text-muted-foreground">No specific mitigation recommendations provided by the AI.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
