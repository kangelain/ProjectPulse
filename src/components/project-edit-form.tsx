'use client';

import type { Project, KeyMilestone, ProjectStatus } from '@/types/project';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { CalendarIcon, PlusCircle, Trash2, Save, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { assessProjectRisk, type AssessProjectRiskInput, type AssessProjectRiskOutput } from '@/ai/flows/risk-assessment';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const milestoneSchema = z.object({
  id: z.string(),
  name: z.string().min(3, 'Milestone name must be at least 3 characters.'),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date format for milestone.' }),
  status: z.enum(['Pending', 'In Progress', 'Completed', 'Blocked']),
});

const projectFormSchema = z.object({
  id: z.string(),
  name: z.string().min(3, 'Project name must be at least 3 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid start date.' }),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid end date.' }),
  budget: z.coerce.number().min(0, 'Budget must be a positive number.'),
  spent: z.coerce.number().min(0, 'Spent amount must be a positive number.'),
  completionPercentage: z.coerce.number().min(0).max(100, 'Completion must be between 0 and 100.'),
  teamLead: z.string().min(3, 'Team lead name must be at least 3 characters.'),
  priority: z.enum(['High', 'Medium', 'Low']),
  portfolio: z.string().min(3, 'Portfolio name must be at least 3 characters.'),
  status: z.enum(['On Track', 'At Risk', 'Delayed', 'Completed', 'Planning']),
  keyMilestones: z.array(milestoneSchema),
  lastUpdated: z.string(),
  riskAssessment: z.custom<AssessProjectRiskOutput>().optional(),
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

interface ProjectEditFormProps {
  project: Project;
  onSubmit: (data: Project) => void; // Changed to Project to include riskAssessment
  onCancel: () => void;
}

export function ProjectEditForm({ project, onSubmit, onCancel }: ProjectEditFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      ...project,
      startDate: project.startDate ? format(parseISO(project.startDate), 'yyyy-MM-dd') : '',
      endDate: project.endDate ? format(parseISO(project.endDate), 'yyyy-MM-dd') : '',
      keyMilestones: project.keyMilestones.map(m => ({
        ...m,
        date: m.date ? format(parseISO(m.date), 'yyyy-MM-dd') : '',
      })),
      riskAssessment: project.riskAssessment || undefined,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'keyMilestones',
  });

  const handleFormSubmit = async (values: ProjectFormValues) => {
    setIsSubmitting(true);
    setFormError(null);

    try {
      // 1. Prepare basic updated project data (without AI yet)
      let projectDataToUpdate: Project = {
        ...values,
        startDate: values.startDate ? new Date(values.startDate).toISOString() : new Date().toISOString(),
        endDate: values.endDate ? new Date(values.endDate).toISOString() : new Date().toISOString(),
        keyMilestones: values.keyMilestones.map(m => ({
          ...m,
          date: m.date ? new Date(m.date).toISOString() : new Date().toISOString(),
        })),
        lastUpdated: new Date().toISOString(),
        riskAssessment: values.riskAssessment, // ensure it's passed through
      };

      // 2. Construct input for AI risk assessment
      const milestoneDetails = projectDataToUpdate.keyMilestones.length > 0
        ? `Key milestones: ${projectDataToUpdate.keyMilestones.map(m => `${m.name} (Target: ${format(parseISO(m.date), 'MMMM d, yyyy')}, Status: ${m.status})`).join('; ')}.`
        : 'No key milestones defined.';
      
      const aiInput: AssessProjectRiskInput = {
        projectDescription: projectDataToUpdate.description,
        projectTimeline: `Project duration: ${format(parseISO(projectDataToUpdate.startDate), 'MMMM d, yyyy')} to ${format(parseISO(projectDataToUpdate.endDate), 'MMMM d, yyyy')}. ${milestoneDetails}`,
        projectBudget: `Budget: $${projectDataToUpdate.budget.toLocaleString()}, Current Spend: $${projectDataToUpdate.spent.toLocaleString()}`,
        teamComposition: `Lead by ${projectDataToUpdate.teamLead}. Portfolio: ${projectDataToUpdate.portfolio}. Priority: ${projectDataToUpdate.priority}. Current Status: ${projectDataToUpdate.status}.`,
        // historicalData: "" // Optionally add historical data if available
      };

      // 3. Call AI risk assessment
      toast({
        title: "AI Risk Assessment In Progress",
        description: "Please wait while the AI analyzes the project risks...",
      });
      const riskAssessmentOutput = await assessProjectRisk(aiInput);

      // 4. Merge AI results into project data
      projectDataToUpdate.riskAssessment = riskAssessmentOutput;
      
      // 5. Call the original onSubmit prop
      onSubmit(projectDataToUpdate);
      
      toast({
        title: "Project Updated & Risk Assessed",
        description: `${projectDataToUpdate.name} has been updated and risks assessed.`,
        variant: "default",
      });

    } catch (err) {
      console.error("Error during project save or AI assessment:", err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setFormError(errorMessage);
      toast({
        title: 'Error Updating Project',
        description: `Failed to update project or assess risks: ${errorMessage}`,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        {formError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter project name" {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="teamLead"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Team Lead</FormLabel>
                <FormControl>
                  <Input placeholder="Enter team lead's name" {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter project description" {...field} rows={3} disabled={isSubmitting} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        disabled={isSubmitting}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? format(parseISO(field.value), "PPP") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? parseISO(field.value) : undefined}
                      onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                      disabled={isSubmitting}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>End Date</FormLabel>
                 <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        disabled={isSubmitting}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? format(parseISO(field.value), "PPP") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? parseISO(field.value) : undefined}
                      onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                      disabled={isSubmitting}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="budget"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Budget ($)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Enter budget" {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="spent"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Spent ($)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Enter amount spent" {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="completionPercentage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Completion (%)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="0-100" {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="portfolio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Portfolio</FormLabel>
                <FormControl>
                  <Input placeholder="Enter portfolio name" {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(['On Track', 'At Risk', 'Delayed', 'Completed', 'Planning'] as ProjectStatus[]).map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div>
          <Label className="text-lg font-semibold">Key Milestones</Label>
          {fields.map((item, index) => (
            <div key={item.id} className="space-y-3 mt-3 p-4 border rounded-md relative">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name={`keyMilestones.${index}.name`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Milestone Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Milestone name" disabled={isSubmitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name={`keyMilestones.${index}.date`}
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Milestone Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              disabled={isSubmitting}
                              className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                            >
                              {field.value ? format(parseISO(field.value), "PPP") : <span>Pick date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ? parseISO(field.value) : undefined}
                             onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                            disabled={isSubmitting}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`keyMilestones.${index}.status`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Milestone Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(['Pending', 'In Progress', 'Completed', 'Blocked'] as KeyMilestone['status'][]).map(s => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => remove(index)}
                disabled={isSubmitting}
                className="absolute top-2 right-2 text-destructive hover:text-destructive-foreground hover:bg-destructive"
                aria-label="Remove milestone"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isSubmitting}
            onClick={() => append({ id: `m-new-${Date.now()}`, name: '', date: format(new Date(), 'yyyy-MM-dd'), status: 'Pending' })}
            className="mt-4"
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Add Milestone
          </Button>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
             <XCircle className="mr-2 h-4 w-4" /> Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving & Assessing...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" /> Save & Assess Risks
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
