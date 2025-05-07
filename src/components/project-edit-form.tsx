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
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { CalendarIcon, PlusCircle, Trash2, Save, XCircle, Loader2, AlertTriangle, Info, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { assessProjectRisk, type AssessProjectRiskInput, type AssessProjectRiskOutput } from '@/ai/flows/risk-assessment';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { mockProjects } from '@/lib/mock-data'; // For user list simulation
import { Badge } from '@/components/ui/badge'; // Added for displaying selected users

const milestoneSchema = z.object({
  id: z.string(),
  name: z.string().min(3, 'Milestone name must be at least 3 characters.').max(100, 'Milestone name too long.'),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date format for milestone.' }),
  status: z.enum(['Pending', 'In Progress', 'Completed', 'Blocked']),
  assignedTo: z.string().optional(),
});

const projectFormSchema = z.object({
  id: z.string(),
  name: z.string().min(3, 'Project name must be at least 3 characters.').max(100, "Project name too long."),
  description: z.string().min(10, 'Description must be at least 10 characters.').max(1000, "Description too long."),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid start date.' }),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid end date.' }),
  budget: z.coerce.number().min(0, 'Budget must be a positive number.').max(1_000_000_000, "Budget too large."),
  spent: z.coerce.number().min(0, 'Spent amount must be a positive number.').max(1_000_000_000, "Spent amount too large."),
  completionPercentage: z.coerce.number().min(0).max(100, 'Completion must be between 0 and 100.'),
  teamLead: z.string().min(3, 'Team lead name must be at least 3 characters.').max(50, "Team lead name too long."),
  assignedUsers: z.array(z.string()).optional(),
  priority: z.enum(['High', 'Medium', 'Low']),
  portfolio: z.string().min(3, 'Portfolio name must be at least 3 characters.').max(50, "Portfolio name too long."),
  status: z.enum(['On Track', 'At Risk', 'Delayed', 'Completed', 'Planning']),
  keyMilestones: z.array(milestoneSchema).max(20, "Maximum 20 milestones allowed."),
  lastUpdated: z.string(),
  riskAssessment: z.custom<AssessProjectRiskOutput>().optional(),
}).refine(data => data.spent <= data.budget, {
  message: "Spent amount cannot exceed budget.",
  path: ["spent"],
}).refine(data => {
  if (!data.startDate || !data.endDate) return true;
  return new Date(data.endDate) >= new Date(data.startDate);
}, {
  message: "End date cannot be before start date.",
  path: ["endDate"],
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

interface ProjectEditFormProps {
  project: Project;
  onSubmit: (data: Project) => void;
  onCancel: () => void;
}

// Simulate a list of available users for assignment
const availableUsers = Array.from(new Set(mockProjects.flatMap(p => [p.teamLead, ...(p.assignedUsers || [])]).filter(Boolean))).sort();


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
      assignedUsers: project.assignedUsers || [],
      keyMilestones: project.keyMilestones.map(m => ({
        ...m,
        date: m.date ? format(parseISO(m.date), 'yyyy-MM-dd') : '',
        assignedTo: m.assignedTo || undefined,
      })),
      riskAssessment: project.riskAssessment || undefined,
    },
     mode: 'onChange',
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'keyMilestones',
  });

  const handleFormSubmit = async (values: ProjectFormValues) => {
    setIsSubmitting(true);
    setFormError(null);

    try {
      let projectDataToUpdate: Project = {
        ...values,
        startDate: values.startDate ? new Date(values.startDate).toISOString() : new Date().toISOString(),
        endDate: values.endDate ? new Date(values.endDate).toISOString() : new Date().toISOString(),
        keyMilestones: values.keyMilestones.map(m => ({
          ...m,
          date: m.date ? new Date(m.date).toISOString() : new Date().toISOString(),
        })),
        lastUpdated: new Date().toISOString(),
        riskAssessment: values.riskAssessment,
      };

      const milestoneDetails = projectDataToUpdate.keyMilestones.length > 0
        ? `Key milestones: ${projectDataToUpdate.keyMilestones.map(m => `${m.name} (Target: ${format(parseISO(m.date), 'MMM d, yyyy')}, Status: ${m.status}, Assigned: ${m.assignedTo || 'N/A'})`).join('; ')}.`
        : 'No key milestones defined.';

      const teamCompositionDetails = [
        `Lead by ${projectDataToUpdate.teamLead}.`,
        projectDataToUpdate.assignedUsers && projectDataToUpdate.assignedUsers.length > 0 ? `Team: ${projectDataToUpdate.assignedUsers.join(', ')}.` : 'No specific team members assigned.',
        `Portfolio: ${projectDataToUpdate.portfolio}.`,
        `Priority: ${projectDataToUpdate.priority}.`,
        `Current Status: ${projectDataToUpdate.status}.`
      ].join(' ');

      const aiInput: AssessProjectRiskInput = {
        projectDescription: projectDataToUpdate.description,
        projectTimeline: `Project duration: ${format(parseISO(projectDataToUpdate.startDate), 'MMM d, yyyy')} to ${format(parseISO(projectDataToUpdate.endDate), 'MMM d, yyyy')}. ${milestoneDetails}`,
        projectBudget: `Budget: $${projectDataToUpdate.budget.toLocaleString()}, Current Spend: $${projectDataToUpdate.spent.toLocaleString()}`,
        teamComposition: teamCompositionDetails,
      };

      toast({
        title: "AI Risk Assessment In Progress",
        description: "Analyzing project risks...",
        duration: 5000,
      });
      const riskAssessmentOutput = await assessProjectRisk(aiInput);

      projectDataToUpdate.riskAssessment = riskAssessmentOutput;

      onSubmit(projectDataToUpdate);

      toast({
        title: "Project Updated & Risk Assessed",
        description: `${projectDataToUpdate.name} has been updated and risks re-assessed.`,
        variant: "default",
        duration: 5000,
      });

    } catch (err) {
      console.error("Error during project save or AI assessment:", err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during update or AI assessment.';
      setFormError(errorMessage);
      toast({
        title: 'Error Updating Project',
        description: errorMessage,
        variant: 'destructive',
        duration: 7000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
        {formError && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Submission Error</AlertTitle>
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        <Alert className="bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300">
          <Info className="h-5 w-5 !text-blue-600 dark:!text-blue-400" />
          <AlertTitle className="font-semibold">AI Risk Re-assessment</AlertTitle>
          <AlertDescription className="text-sm">
            Modifying project details will trigger a new AI-powered risk assessment upon saving.
            The results will be updated on the project details page.
          </AlertDescription>
        </Alert>

        <section className="space-y-6">
          <h3 className="text-xl font-semibold text-foreground border-b pb-2 mb-6">Project Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
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
                   <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                      <FormControl>
                          <SelectTrigger className="h-10">
                              <SelectValue placeholder="Select team lead" />
                          </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                          {availableUsers.map(user => (
                              <SelectItem key={user} value={user}>{user}</SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
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
                  <Textarea placeholder="Enter project description" {...field} rows={4} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="assignedUsers"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2"><Users className="h-4 w-4" /> Assigned Team Members (Optional)</FormLabel>
                <Select
                  onValueChange={(selectedUser) => { // `value` here is the single user selected/deselected in this interaction
                    const currentSelection = field.value || [];
                    const newSelection = currentSelection.includes(selectedUser)
                      ? currentSelection.filter(u => u !== selectedUser)
                      : [...currentSelection, selectedUser];
                    field.onChange(newSelection);
                  }}
                  // The `value` prop on Select itself is not used for multi-select indication here,
                  // rather the visual feedback is through the badge list and checkmarks.
                  disabled={isSubmitting}
                >
                  <FormControl>
                     <SelectTrigger className="h-auto min-h-10 py-2">
                        <SelectValue placeholder="Select/Deselect team members" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableUsers.map((user) => (
                      <SelectItem key={user} value={user}>
                        <div className="flex items-center">
                          <span className="mr-2">
                            {(field.value || []).includes(user) ? '✅' : '🔲'}
                          </span>
                          {user}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {field.value && field.value.length > 0 && (
                    <div className="pt-2 flex flex-wrap gap-2">
                        {field.value.map(user => (
                            <Badge key={user} variant="secondary" className="py-1 px-2 text-xs">
                                {user}
                                <button type="button" onClick={() => field.onChange(field.value?.filter(v => v !== user))} className="ml-1.5 text-muted-foreground hover:text-foreground">&times;</button>
                            </Badge>
                        ))}
                    </div>
                )}
                <FormDescription className="text-xs">Click to add/remove users. Selected users are listed below.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        <section className="space-y-6">
           <h3 className="text-xl font-semibold text-foreground border-b pb-2 mb-6">Timeline & Financials</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
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
                            "w-full pl-3 text-left font-normal h-10",
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
                            "w-full pl-3 text-left font-normal h-10",
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
                        disabled={(date) =>
                            form.getValues("startDate") ? date < parseISO(form.getValues("startDate")) : false || isSubmitting
                        }
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
              name="budget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Budget ($)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 50000" {...field} disabled={isSubmitting} />
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
                    <Input type="number" placeholder="e.g., 25000" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </section>

        <section className="space-y-6">
            <h3 className="text-xl font-semibold text-foreground border-b pb-2 mb-6">Categorization & Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
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
                <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                        <FormControl>
                            <SelectTrigger className="h-10">
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
                            <SelectTrigger className="h-10">
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
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2 mb-6">
            <h3 className="text-xl font-semibold text-foreground">Key Milestones</h3>
             <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isSubmitting || fields.length >= 20}
                onClick={() => append({ id: `m-new-${Date.now()}`, name: '', date: format(new Date(), 'yyyy-MM-dd'), status: 'Pending', assignedTo: '' })}
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Add Milestone
              </Button>
          </div>
          {fields.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No milestones added yet.</p>}
          {fields.map((item, index) => (
            <div key={item.id} className="space-y-4 p-5 border rounded-lg shadow-sm bg-secondary/30 relative">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-x-6 gap-y-5 items-start">
                <FormField
                  control={form.control}
                  name={`keyMilestones.${index}.name`}
                  render={({ field }) => (
                    <FormItem className="lg:col-span-2">
                      <FormLabel>Milestone {index + 1} Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Design Complete" disabled={isSubmitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name={`keyMilestones.${index}.date`}
                  render={({ field }) => (
                    <FormItem className="flex flex-col lg:col-span-2">
                      <FormLabel>Target Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              disabled={isSubmitting}
                              className={cn("w-full pl-3 text-left font-normal h-10", !field.value && "text-muted-foreground")}
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
                    <FormItem className="lg:col-span-1">
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                        <FormControl>
                          <SelectTrigger className="h-10">
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
                <FormField
                  control={form.control}
                  name={`keyMilestones.${index}.assignedTo`}
                  render={({ field }) => (
                    <FormItem className="lg:col-span-2">
                      <FormLabel>Assigned To</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                        <FormControl>
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Assign user" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Unassigned</SelectItem>
                          {availableUsers.map(user => (
                              <SelectItem key={user} value={user}>{user}</SelectItem>
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
                size="icon"
                onClick={() => remove(index)}
                disabled={isSubmitting}
                className="absolute top-3 right-3 text-destructive hover:text-destructive-foreground hover:bg-destructive/10 h-8 w-8"
                aria-label="Remove milestone"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
           {form.formState.errors.keyMilestones && !form.formState.errors.keyMilestones.root && (
                <FormMessage className="text-sm text-destructive mt-2">
                    {(form.formState.errors.keyMilestones as any)?.message}
                </FormMessage>
            )}
        </section>

        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting} size="lg">
             <XCircle className="mr-2 h-5 w-5" /> Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !form.formState.isValid && form.formState.isSubmitted} size="lg">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Saving & Assessing...
              </>
            ) : (
              <>
                <Save className="mr-2 h-5 w-5" /> Save & Assess Risks
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
