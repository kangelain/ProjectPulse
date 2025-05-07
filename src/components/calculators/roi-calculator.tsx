
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
import { PlusCircle, Trash2, Calculator as CalculatorIcon, TrendingUp, Info, AlertTriangle, ReceiptText } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle as ShadcnAlertTitle } from "@/components/ui/alert";
import { Separator } from '@/components/ui/separator';

const roiCalculatorSchema = z.object({
  initialInvestment: z.coerce.number().positive({ message: "Initial investment must be a positive number." }),
  projectLifespan: z.coerce.number().int().min(1, "Lifespan must be at least 1 year.").max(20, "Lifespan max 20 years."),
  discountRate: z.coerce.number().min(0, "Discount rate cannot be negative.").max(100, "Discount rate cannot exceed 100."),
  cashFlows: z.array(z.object({ value: z.coerce.number() })).min(1, "At least one cash flow year is required."),
});

type RoiFormValues = z.infer<typeof roiCalculatorSchema>;

interface CalculationResults {
  npv: number;
  simpleRoi: number;
  paybackPeriod: string; // Can be "X years", "Less than 1 year", or "Never"
  totalNetProfit: number;
  totalDiscountedCashFlow: number;
}

export function RoiCalculator() {
  const [results, setResults] = useState<CalculationResults | null>(null);

  const form = useForm<RoiFormValues>({
    resolver: zodResolver(roiCalculatorSchema),
    defaultValues: {
      initialInvestment: 100000,
      projectLifespan: 5,
      discountRate: 10,
      cashFlows: Array(5).fill({ value: 0 }),
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "cashFlows",
  });

  const projectLifespan = form.watch('projectLifespan');

  useEffect(() => {
    const currentCashFlowsLength = fields.length;
    if (projectLifespan > 0 && projectLifespan !== currentCashFlowsLength) {
      const newCashFlows = Array(projectLifespan).fill(null).map((_, i) => {
        return fields[i] || { value: 0 }; // Preserve existing values if possible
      });
      replace(newCashFlows);
    }
  }, [projectLifespan, fields, replace]);
  

  function onSubmit(data: RoiFormValues) {
    const { initialInvestment, discountRate, cashFlows: cfArray } = data;
    const rate = discountRate / 100;
    let npv = -initialInvestment;
    let totalDiscountedCashFlow = 0;
    let cumulativeCashFlow = -initialInvestment;
    let paybackPeriodYears = 0;
    let paybackFound = false;
    let totalNetProfit = -initialInvestment;

    cfArray.forEach((cfItem, index) => {
      const year = index + 1;
      const cashFlow = cfItem.value;
      totalNetProfit += cashFlow;
      const discountedCf = cashFlow / Math.pow(1 + rate, year);
      npv += discountedCf;
      totalDiscountedCashFlow += discountedCf;
      
      if (!paybackFound) {
        cumulativeCashFlow += cashFlow;
        if (cumulativeCashFlow >= 0) {
          paybackFound = true;
          // If it's exactly 0, payback is this year.
          // If it becomes positive this year, it's between last year and this year.
          if (cumulativeCashFlow === 0) {
             paybackPeriodYears = year;
          } else {
            const previousCumulativeCashFlow = cumulativeCashFlow - cashFlow;
            paybackPeriodYears = (index) + (Math.abs(previousCumulativeCashFlow) / cashFlow);
          }
        }
      }
    });

    const simpleRoi = initialInvestment > 0 ? (totalNetProfit / initialInvestment) * 100 : 0;
    
    let paybackPeriodDisplay: string;
    if (!paybackFound && totalNetProfit < initialInvestment) {
        paybackPeriodDisplay = "Never (within lifespan)";
    } else if (!paybackFound && totalNetProfit >= initialInvestment) {
        // This case implies an issue or extremely long payback beyond simple calculation
        paybackPeriodDisplay = `Over ${cfArray.length} years (complex)`;
    }
    else if (paybackPeriodYears === 0 && initialInvestment === 0) { // Edge case, immediate payback if no investment
      paybackPeriodDisplay = "Immediate (no investment)";
    } else if (paybackPeriodYears < 1) {
      paybackPeriodDisplay = `Less than 1 year (${(paybackPeriodYears * 12).toFixed(1)} months)`;
    } else {
      paybackPeriodDisplay = `${paybackPeriodYears.toFixed(2)} years`;
    }


    setResults({
      npv,
      simpleRoi,
      paybackPeriod: paybackPeriodDisplay,
      totalNetProfit,
      totalDiscountedCashFlow,
    });
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
  };

  return (
    <Card className="w-full shadow-2xl">
      <CardHeader>
        <div className="flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-primary" />
            <div>
                <CardTitle className="text-2xl">Return on Investment (ROI) Calculator</CardTitle>
                <CardDescription>Analyze project viability using Discounted Cash Flow (DCF) metrics.</CardDescription>
            </div>
        </div>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="initialInvestment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial Investment ($)</FormLabel>
                    <FormControl><Input type="number" placeholder="e.g., 100000" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="projectLifespan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Lifespan (Years)</FormLabel>
                    <FormControl><Input type="number" placeholder="e.g., 5" {...field} onChange={(e) => {
                        field.onChange(e);
                        const newLifespan = parseInt(e.target.value, 10);
                        if (!isNaN(newLifespan) && newLifespan > 0 && newLifespan <= 20) {
                            const currentCashFlows = form.getValues("cashFlows");
                            const newCashFlowsArray = Array(newLifespan).fill(null).map((_,i) => currentCashFlows[i] || {value: 0});
                            replace(newCashFlowsArray);
                        } else if (newLifespan === 0) {
                            replace([]); // Clear cash flows if lifespan is 0
                        }
                    }} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="discountRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount Rate (%)</FormLabel>
                    <FormControl><Input type="number" placeholder="e.g., 10 for 10%" {...field} /></FormControl>
                    <FormDescription className="text-xs">Annual rate used to discount future cash flows.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div>
              <Label className="text-lg font-semibold mb-3 block">Expected Annual Net Cash Flows ($)</Label>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {fields.map((field, index) => (
                  <FormField
                    key={field.id}
                    control={form.control}
                    name={`cashFlows.${index}.value`}
                    render={({ field: formField }) => (
                      <FormItem className="flex items-center gap-3">
                        <FormLabel className="min-w-[60px] text-sm text-muted-foreground">Year {index + 1}:</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder={`Cash Flow for Year ${index + 1}`} {...formField} />
                        </FormControl>
                         {/* Remove button for cash flows is not standard for fixed lifespan, but can be added if dynamic length is preferred */}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
                {form.formState.errors.cashFlows && (
                    <p className="text-xs text-destructive mt-2">{form.formState.errors.cashFlows.message || form.formState.errors.cashFlows.root?.message}</p>
                )}
            </div>
            <Alert variant="default" className="bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-700">
                <Info className="h-5 w-5 !text-blue-600 dark:!text-blue-400" />
                <ShadcnAlertTitle className="text-blue-700 dark:text-blue-300 font-semibold">Calculation Notes</ShadcnAlertTitle>
                <AlertDescription className="text-blue-600 dark:text-blue-400 text-xs">
                    Enter positive values for cash inflows (profits) and negative values for cash outflows (expenses) for each year.
                    The discount rate is typically the Weighted Average Cost of Capital (WACC).
                    IRR (Internal Rate of Return) calculation is complex and omitted in this version.
                </AlertDescription>
            </Alert>


          </CardContent>
          <CardFooter className="flex flex-col items-stretch p-6 gap-6">
            <Button type="submit" size="lg">
              <CalculatorIcon className="mr-2 h-5 w-5" /> Calculate ROI
            </Button>

            {results && (
              <Card className="bg-secondary/50 p-6 shadow-inner">
                 <CardTitle className="text-xl mb-4 flex items-center"><ReceiptText className="mr-2 h-6 w-6 text-primary"/>Calculation Results</CardTitle>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Total Net Profit:</p>
                    <p className="text-lg font-semibold text-foreground">{formatCurrency(results.totalNetProfit)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Total Discounted Cash Flow:</p>
                    <p className="text-lg font-semibold text-foreground">{formatCurrency(results.totalDiscountedCashFlow)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Net Present Value (NPV):</p>
                    <p className={cn("text-xl font-bold", results.npv >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
                      {formatCurrency(results.npv)}
                    </p>
                  </div>
                   <div className="space-y-1">
                    <p className="text-muted-foreground">Simple ROI:</p>
                    <p className={cn("text-xl font-bold", results.simpleRoi >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
                      {results.simpleRoi.toFixed(2)}%
                    </p>
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <p className="text-muted-foreground">Simple Payback Period:</p>
                    <p className="text-lg font-semibold text-foreground">{results.paybackPeriod}</p>
                  </div>
                </div>
                <Separator className="my-4"/>
                 <AlertDescription className="text-xs text-muted-foreground">
                    <strong>NPV:</strong> Positive NPV suggests the investment should be made. Negative NPV suggests it should be rejected.
                    <br/>
                    <strong>Simple ROI:</strong> Measures profitability relative to investment cost. Does not account for time value of money.
                    <br/>
                    <strong>Payback Period:</strong> Time it takes for the project to recoup its initial investment from net cash flows.
                </AlertDescription>
              </Card>
            )}
             {form.formState.isSubmitted && Object.keys(form.formState.errors).length > 0 && (
                <Alert variant="destructive" className="mt-4">
                    <AlertTriangle className="h-4 w-4" />
                    <ShadcnAlertTitle>Validation Error</ShadcnAlertTitle>
                    <AlertDescription>Please correct the errors in the form before calculating.</AlertDescription>
                </Alert>
            )}
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

