
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
import { PlusCircle, Trash2, Calculator as CalculatorIcon, TrendingUp, Info, AlertTriangle, ReceiptText, BarChart3 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle as ShadcnAlertTitle } from "@/components/ui/alert";
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { RoiResultsChart } from '@/components/charts/roi-results-chart';
import { cn } from '@/lib/utils';

const roiCalculatorSchema = z.object({
  initialInvestment: z.coerce.number().positive({ message: "Initial investment must be a positive number." }),
  projectLifespan: z.coerce.number().int().min(1, "Lifespan must be at least 1 year.").max(20, "Lifespan max 20 years."),
  discountRate: z.coerce.number().min(0, "Discount rate cannot be negative.").max(100, "Discount rate cannot exceed 100."),
  cashFlows: z.array(z.object({ value: z.coerce.number() })).min(1, "At least one cash flow year is required."),
});

type RoiFormValues = z.infer<typeof roiCalculatorSchema>;

export interface CalculationResults {
  npv: number;
  simpleRoi: number;
  paybackPeriod: string;
  totalNetProfit: number;
  totalDiscountedCashFlow: number;
  yearlyData: Array<{ year: number, undiscountedCf: number, discountedCf: number, cumulativeDiscountedCf: number }>;
}

export function RoiCalculator() {
  const [results, setResults] = useState<CalculationResults | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const form = useForm<RoiFormValues>({
    resolver: zodResolver(roiCalculatorSchema),
    defaultValues: {
      initialInvestment: 100000,
      projectLifespan: 5,
      discountRate: 10,
      cashFlows: Array(5).fill({ value: 25000 }), // Initial positive cash flow
    },
  });

  const { fields, replace } = useFieldArray({
    control: form.control,
    name: "cashFlows",
  });

  const projectLifespan = form.watch('projectLifespan');

  useEffect(() => {
    const currentCashFlowsLength = fields.length;
    if (projectLifespan > 0 && projectLifespan !== currentCashFlowsLength) {
      const newCashFlows = Array(projectLifespan).fill(null).map((_, i) => {
        return fields[i] || { value: 25000 }; // Preserve existing values or use default
      });
      replace(newCashFlows);
    }
  }, [projectLifespan, fields.length, replace]); // Updated dependencies
  

  function onSubmit(data: RoiFormValues) {
    const { initialInvestment, discountRate, cashFlows: cfArray } = data;
    const rate = discountRate / 100;
    let npv = -initialInvestment;
    let totalDiscountedCashFlow = 0;
    let cumulativeCashFlow = -initialInvestment; // For simple payback
    let cumulativeDiscountedCfForNpv = -initialInvestment; // For NPV calculation
    let paybackPeriodYears = 0;
    let paybackFound = false;
    let totalNetProfit = -initialInvestment;
    const yearlyData: CalculationResults['yearlyData'] = [];

    cfArray.forEach((cfItem, index) => {
      const year = index + 1;
      const cashFlow = cfItem.value;
      totalNetProfit += cashFlow;
      const discountedCf = cashFlow / Math.pow(1 + rate, year);
      
      cumulativeDiscountedCfForNpv += discountedCf; // This is the one for NPV
      totalDiscountedCashFlow += discountedCf; // Sum of individual discounted CFs for reporting
      
      yearlyData.push({
        year,
        undiscountedCf: cashFlow,
        discountedCf,
        cumulativeDiscountedCf: cumulativeDiscountedCfForNpv,
      });
      
      if (!paybackFound) {
        cumulativeCashFlow += cashFlow; // Simple payback uses undiscounted cashflows
        if (cumulativeCashFlow >= 0) {
          paybackFound = true;
          if (cumulativeCashFlow === 0) {
             paybackPeriodYears = year;
          } else {
            const previousCumulativeCashFlow = cumulativeCashFlow - cashFlow;
            paybackPeriodYears = (index) + (Math.abs(previousCumulativeCashFlow) / (cashFlow || 1)); // Avoid division by zero
          }
        }
      }
    });
    
    npv = cumulativeDiscountedCfForNpv; // NPV is the final cumulative discounted cash flow

    const simpleRoi = initialInvestment > 0 ? (totalNetProfit / initialInvestment) * 100 : (totalNetProfit > 0 ? Infinity : 0);
    
    let paybackPeriodDisplay: string;
    if (!paybackFound) {
        paybackPeriodDisplay = `Over ${cfArray.length} years`;
        if (totalNetProfit < initialInvestment && cumulativeCashFlow < 0) {
             paybackPeriodDisplay = "Never (within lifespan)";
        }
    } else if (paybackPeriodYears === 0 && initialInvestment === 0) {
      paybackPeriodDisplay = "Immediate (no investment)";
    } else if (paybackPeriodYears < 1) {
      paybackPeriodDisplay = `~${(paybackPeriodYears * 12).toFixed(1)} months`;
    } else {
      paybackPeriodDisplay = `${paybackPeriodYears.toFixed(2)} years`;
    }

    setResults({
      npv,
      simpleRoi,
      paybackPeriod: paybackPeriodDisplay,
      totalNetProfit,
      totalDiscountedCashFlow,
      yearlyData,
    });
    setIsModalOpen(true);
  }

  const formatCurrency = (amount: number, minimumFractionDigits = 2) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits, maximumFractionDigits: 2 }).format(amount);
  };

  return (
    <>
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
                              const newCashFlowsArray = Array(newLifespan).fill(null).map((_,i) => currentCashFlows[i] || {value: 25000});
                              replace(newCashFlowsArray);
                          } else if (newLifespan === 0 || isNaN(newLifespan)) {
                              replace([]); 
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
              {form.formState.isSubmitted && Object.keys(form.formState.errors).length > 0 && !isModalOpen && (
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

      {results && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center">
                <ReceiptText className="mr-3 h-7 w-7 text-primary"/>ROI Calculation Results
              </DialogTitle>
              <DialogDescription>
                Summary of your project's financial viability based on the provided inputs.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 flex-grow overflow-y-auto pr-2">
              <div className="space-y-4">
                <Card className="bg-secondary/30 shadow-sm">
                  <CardHeader className='pb-2 pt-4 px-4'>
                    <CardTitle className='text-lg'>Key Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Net Present Value (NPV):</span>
                      <span className={cn("text-lg font-semibold", results.npv >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
                        {formatCurrency(results.npv)}
                      </span>
                    </div>
                    <Separator/>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Simple ROI:</span>
                      <span className={cn("text-lg font-semibold", results.simpleRoi >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
                        {isFinite(results.simpleRoi) ? `${results.simpleRoi.toFixed(2)}%` : "N/A (No Investment)"}
                      </span>
                    </div>
                    <Separator/>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Simple Payback Period:</span>
                      <span className="text-lg font-semibold text-foreground">{results.paybackPeriod}</span>
                    </div>
                    <Separator/>
                     <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Total Net Profit (Undiscounted):</span>
                      <span className="text-lg font-semibold text-foreground">{formatCurrency(results.totalNetProfit, 0)}</span>
                    </div>
                    <Separator/>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Total Discounted Cash Flow:</span>
                      <span className="text-lg font-semibold text-foreground">{formatCurrency(results.totalDiscountedCashFlow, 0)}</span>
                    </div>
                  </CardContent>
                </Card>
                 <AlertDescription className="text-xs text-muted-foreground p-3 border rounded-md bg-background">
                    <strong>NPV:</strong> Positive NPV suggests the investment may be worthwhile.
                    <br/>
                    <strong>Simple ROI:</strong> Basic profitability measure, ignores time value of money.
                    <br/>
                    <strong>Payback Period:</strong> Time to recoup initial investment (undiscounted).
                </AlertDescription>
              </div>

              <div className="md:col-span-1">
                 <Card className="h-full flex flex-col">
                    <CardHeader className="pb-2 pt-4 px-4">
                        <CardTitle className="text-lg flex items-center"> <BarChart3 className="mr-2 h-5 w-5 text-accent"/>Cash Flow Analysis</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow px-2 pb-2">
                        <RoiResultsChart
                            initialInvestment={form.getValues('initialInvestment')}
                            yearlyData={results.yearlyData}
                        />
                    </CardContent>
                 </Card>
              </div>
            </div>

            <DialogFooter className="pt-4 border-t">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
