
'use client';

import { useState, useEffect } from 'react'; 
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Trash2, Calculator, Percent, DollarSign } from 'lucide-react'; 
import { cn } from '@/lib/utils';

const budgetItemSchema = z.object({
  description: z.string().min(1, "Description is required.").max(150, "Description too long."),
  category: z.string().min(1, "Category is required."),
  amount: z.coerce.number().min(0, "Amount must be non-negative.").max(1_000_000_000, "Amount too large."),
});

const budgetCalculatorSchema = z.object({
  budgetItems: z.array(budgetItemSchema).min(1, "At least one budget item is required."),
  contingencyPercentage: z.coerce.number().min(0).max(100).optional(),
});

type BudgetFormValues = z.infer<typeof budgetCalculatorSchema>;

const defaultCategories = [
  "Personnel", "Equipment", "Software/Tools", "Marketing", "Travel", 
  "Training", "Legal/Consulting", "Office Space", "Utilities", "Other"
];

export function ProjectBudgetCalculator() {
  const [totalBudget, setTotalBudget] = useState<number | null>(null);
  const [subtotal, setSubtotal] = useState<number>(0);
  const [contingencyAmount, setContingencyAmount] = useState<number>(0);

  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetCalculatorSchema),
    defaultValues: {
      budgetItems: [{ description: '', category: defaultCategories[0], amount: 0 }],
      contingencyPercentage: 10,
    },
     mode: 'onChange', // Calculate on change
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "budgetItems",
  });

  const calculateBudget = (data: BudgetFormValues) => {
    const currentSubtotal = data.budgetItems.reduce((sum, item) => sum + (item.amount || 0), 0);
    setSubtotal(currentSubtotal);

    const currentContingencyAmount = data.contingencyPercentage
      ? (currentSubtotal * (data.contingencyPercentage / 100))
      : 0;
    setContingencyAmount(currentContingencyAmount);

    setTotalBudget(currentSubtotal + currentContingencyAmount);
  };
  
  const watchedItems = form.watch("budgetItems");
  const watchedContingency = form.watch("contingencyPercentage");

  useEffect(() => { 
    calculateBudget(form.getValues());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedItems, watchedContingency, form.getValues]);


  function onSubmit(data: BudgetFormValues) {
    calculateBudget(data); // Ensure calculation on explicit submit too, though useEffect handles most.
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  return (
    <Card className="w-full shadow-xl"> {/* Consistent shadow */}
      <CardHeader className="pb-4 pt-5 px-5"> {/* Adjusted padding */}
        <div className="flex items-center gap-2.5"> {/* Adjusted gap */}
            <DollarSign className="h-6 w-6 text-primary" /> {/* Adjusted size */}
            <div>
                <CardTitle className="text-xl">Project Budget Calculator</CardTitle> {/* Adjusted size */}
                <CardDescription className="text-xs">Estimate the total budget for your project, including contingency.</CardDescription> {/* Adjusted size */}
            </div>
        </div>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-5 px-5"> {/* Adjusted spacing and padding */}
            <div>
              <Label className="text-md font-semibold mb-2.5 block">Budget Items</Label> {/* Adjusted size and margin */}
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-start py-2.5 border-b last:border-b-0"> {/* Adjusted gap and padding */}
                  <FormField
                    control={form.control}
                    name={`budgetItems.${index}.description`}
                    render={({ field: formField }) => (
                      <FormItem className="sm:col-span-5">
                        <FormLabel className="sr-only">Description</FormLabel>
                        <FormControl>
                          <Input placeholder="Item Description" {...formField} className="h-9 text-xs" /> {/* Adjusted size */}
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`budgetItems.${index}.category`}
                    render={({ field: formField }) => (
                      <FormItem className="sm:col-span-3">
                        <FormLabel className="sr-only">Category</FormLabel>
                        <Select onValueChange={formField.onChange} defaultValue={formField.value}>
                          <FormControl>
                            <SelectTrigger className="h-9 text-xs"> {/* Adjusted size */}
                              <SelectValue placeholder="Select Category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {defaultCategories.map(cat => <SelectItem key={cat} value={cat} className="text-xs">{cat}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`budgetItems.${index}.amount`}
                    render={({ field: formField }) => (
                      <FormItem className="sm:col-span-3">
                        <FormLabel className="sr-only">Amount</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Amount" {...formField} className="h-9 text-xs" />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    className="sm:col-span-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 self-center h-8 w-8" /* Adjusted size and color */
                    aria-label="Remove item"
                  >
                    <Trash2 className="h-4 w-4" /> {/* Adjusted size */}
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ description: '', category: defaultCategories[0], amount: 0 })}
                className="mt-3 h-9 px-3 text-xs" /* Adjusted margin and size */
              >
                <PlusCircle className="mr-1.5 h-3.5 w-3.5" /> Add Budget Item {/* Adjusted icon size */}
              </Button>
            </div>

            <FormField
              control={form.control}
              name="contingencyPercentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-md font-semibold flex items-center"><Percent className="mr-1.5 h-4 w-4 text-accent"/>Contingency Percentage (Optional)</FormLabel> {/* Adjusted size */}
                  <FormControl>
                    <Input type="number" placeholder="e.g., 10 for 10%" {...field} className="h-9 text-xs" />
                  </FormControl>
                  <FormDescription className="text-xs">A buffer for unforeseen expenses.</FormDescription>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 gap-3 border-t"> {/* Adjusted padding and gap */}
            <div className="space-y-1.5 text-xs sm:text-sm"> {/* Adjusted spacing and size */}
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-semibold text-foreground ml-2">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Contingency ({form.getValues('contingencyPercentage') || 0}%):</span>
                <span className="font-semibold text-foreground ml-2">{formatCurrency(contingencyAmount)}</span>
              </div>
              <div className="flex justify-between items-center border-t pt-1.5 mt-1.5"> {/* Adjusted padding and margin */}
                <span className="text-md font-bold text-primary">Total Estimated Budget:</span> {/* Adjusted size */}
                <span className="text-md font-bold text-primary ml-2">
                  {totalBudget !== null ? formatCurrency(totalBudget) : 'N/A'}
                </span>
              </div>
            </div>
            <Button type="submit" size="default" className="w-full sm:w-auto h-10 text-sm font-semibold"> {/* Adjusted size and height */}
              <Calculator className="mr-1.5 h-4 w-4" /> Calculate Budget {/* Adjusted icon size */}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
