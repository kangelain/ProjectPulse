
'use client';

import { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Trash2, Calculator, ReceiptText, Percent } from 'lucide-react';
import { cn } from '@/lib/utils';

const budgetItemSchema = z.object({
  description: z.string().min(1, "Description is required."),
  category: z.string().min(1, "Category is required."),
  amount: z.coerce.number().min(0, "Amount must be non-negative."),
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
  
  // Watch form changes to update budget calculation dynamically
  const watchedItems = form.watch("budgetItems");
  const watchedContingency = form.watch("contingencyPercentage");

  useState(() => {
    if (form.formState.isSubmitted || (watchedItems && watchedContingency !== undefined)) {
       calculateBudget(form.getValues());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedItems, watchedContingency, form.getValues, form.formState.isSubmitted]);


  function onSubmit(data: BudgetFormValues) {
    calculateBudget(data);
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  return (
    <Card className="w-full shadow-2xl">
      <CardHeader>
        <div className="flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-primary" />
            <div>
                <CardTitle className="text-2xl">Project Budget Calculator</CardTitle>
                <CardDescription>Estimate the total budget for your project, including contingency.</CardDescription>
            </div>
        </div>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-lg font-semibold mb-3 block">Budget Items</Label>
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start py-3 border-b last:border-b-0">
                  <FormField
                    control={form.control}
                    name={`budgetItems.${index}.description`}
                    render={({ field: formField }) => (
                      <FormItem className="sm:col-span-5">
                        <FormLabel className="sr-only">Description</FormLabel>
                        <FormControl>
                          <Input placeholder="Item Description" {...formField} />
                        </FormControl>
                        <FormMessage />
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
                            <SelectTrigger>
                              <SelectValue placeholder="Select Category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {defaultCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
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
                          <Input type="number" placeholder="Amount" {...formField} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    className="sm:col-span-1 text-destructive hover:bg-destructive/10 self-center"
                    aria-label="Remove item"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ description: '', category: defaultCategories[0], amount: 0 })}
                className="mt-4"
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Add Budget Item
              </Button>
            </div>

            <FormField
              control={form.control}
              name="contingencyPercentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-semibold flex items-center"><Percent className="mr-2 h-5 w-5 text-accent"/>Contingency Percentage (Optional)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 10 for 10%" {...field} />
                  </FormControl>
                  <FormDescription>A buffer for unforeseen expenses.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 gap-4">
            <div className="space-y-2 text-sm sm:text-base">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-semibold text-foreground ml-2">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Contingency ({form.getValues('contingencyPercentage') || 0}%):</span>
                <span className="font-semibold text-foreground ml-2">{formatCurrency(contingencyAmount)}</span>
              </div>
              <div className="flex justify-between items-center border-t pt-2 mt-2">
                <span className="text-lg font-bold text-primary">Total Estimated Budget:</span>
                <span className="text-lg font-bold text-primary ml-2">
                  {totalBudget !== null ? formatCurrency(totalBudget) : 'N/A'}
                </span>
              </div>
            </div>
            <Button type="submit" size="lg" className="w-full sm:w-auto">
              <Calculator className="mr-2 h-5 w-5" /> Calculate Budget
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
