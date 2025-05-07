
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
import { Calculator as CalculatorIcon, TrendingUp, Info, AlertTriangle, ReceiptText, BarChart3 } from 'lucide-react';
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
      cashFlows: Array(5).fill({ value: 25000 }), 
    },
    mode: 'onChange', // Calculate on change
  });

  const { fields, replace } = useFieldArray({
    control: form.control,
    name: "cashFlows",
  });

  const projectLifespan = form.watch('projectLifespan');

  useEffect(() => {
    const currentCashFlowsLength = fields.length;
    if (projectLifespan > 0 && projectLifespan <= 20 && projectLifespan !== currentCashFlowsLength) {
      const newCashFlows = Array(projectLifespan).fill(null).map((_, i) => {
        return fields[i] || { value: 25000 }; 
      });
      replace(newCashFlows);
    } else if (projectLifespan === 0 || isNaN(projectLifespan) || projectLifespan > 20) {
        // Don't clear, let validation handle it, or set to a min/max if desired.
        // For now, if invalid, just let existing cashFlows remain until valid lifespan is set.
    }
  }, [projectLifespan, fields, replace]); 
  

  function calculateAndSetResults(data: RoiFormValues) {
    const { initialInvestment, discountRate, cashFlows: cfArray } = data;
    const rate = discountRate / 100;
    let npv = -initialInvestment;
    let totalDiscountedCashFlow = 0;
    let cumulativeCashFlow = -initialInvestment; 
    let cumulativeDiscountedCfForNpv = -initialInvestment; 
    let paybackPeriodYears = 0;
    let paybackFound = false;
    let totalNetProfit = -initialInvestment;
    const yearlyData: CalculationResults['yearlyData'] = [];

    cfArray.forEach((cfItem, index) => {
      const year = index + 1;
      const cashFlow = cfItem.value;
      totalNetProfit += cashFlow;
      const discountedCf = cashFlow / Math.pow(1 + rate, year);
      
      cumulativeDiscountedCfForNpv += discountedCf; 
      totalDiscountedCashFlow += discountedCf; 
      
      yearlyData.push({
        year,
        undiscountedCf: cashFlow,
        discountedCf,
        cumulativeDiscountedCf: cumulativeDiscountedCfForNpv,
      });
      
      if (!paybackFound) {
        cumulativeCashFlow += cashFlow; 
        if (cumulativeCashFlow >= 0) {
          paybackFound = true;
          if (cumulativeCashFlow === 0) {
             paybackPeriodYears = year;
          } else {
            const previousCumulativeCashFlow = cumulativeCashFlow - cashFlow;
            paybackPeriodYears = (index) + (Math.abs(previousCumulativeCashFlow) / (cashFlow || 1)); 
          }
        }
      }
    });
    
    npv = cumulativeDiscountedCfForNpv; 

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
  }

  function onSubmit(data: RoiFormValues) {
    calculateAndSetResults(data);
    setIsModalOpen(true);
  }
  
  // Auto-calculate on valid form changes.
  const watchedFormValues = form.watch();
  useEffect(() => {
    if (form.formState.isValid) {
      calculateAndSetResults(watchedFormValues);
    } else {
      setResults(null); // Clear results if form is invalid
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedFormValues, form.formState.isValid]);


  const formatCurrency = (amount: number, minimumFractionDigits = 2) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits, maximumFractionDigits: 2 }).format(amount);
  };

  return (
    <>
      <Card className="w-full shadow-xl">
        <CardHeader className="pb-4 pt-5 px-5">
          <div className="flex items-center gap-2.5">
              <TrendingUp className="h-6 w-6 text-primary" />
              <div>
                  <CardTitle className="text-xl">Return on Investment (ROI) Calculator</CardTitle>
                  <CardDescription className="text-xs">Analyze project viability using Discounted Cash Flow (DCF) metrics.</CardDescription>
              </div>
          </div>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6 px-5"> {/* Adjusted spacing and padding */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4"> {/* Adjusted gap */}
                <FormField
                  control={form.control}
                  name="initialInvestment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium">Initial Investment ($)</FormLabel>
                      <FormControl><Input type="number" placeholder="e.g., 100000" {...field} className="h-9 text-xs" /></FormControl>
                      <FormMessage className="text-xs"/>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="projectLifespan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium">Project Lifespan (Years)</FormLabel>
                      <FormControl><Input type="number" placeholder="e.g., 5" {...field} className="h-9 text-xs" onChange={(e) => {
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
                      <FormMessage className="text-xs"/>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="discountRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium">Discount Rate (%)</FormLabel>
                      <FormControl><Input type="number" placeholder="e.g., 10 for 10%" {...field} className="h-9 text-xs"/></FormControl>
                      <FormDescription className="text-xs mt-1">Annual rate to discount future cash flows.</FormDescription> {/* Adjusted margin */}
                      <FormMessage className="text-xs"/>
                    </FormItem>
                  )}
                />
              </div>
              
              <div>
                <Label className="text-md font-semibold mb-2.5 block">Expected Annual Net Cash Flows ($)</Label>
                <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1.5"> {/* Adjusted spacing, height, padding */}
                  {fields.map((field, index) => (
                    <FormField
                      key={field.id}
                      control={form.control}
                      name={`cashFlows.${index}.value`}
                      render={({ field: formField }) => (
                        <FormItem className="flex items-center gap-2.5">
                          <FormLabel className="min-w-[50px] text-xs text-muted-foreground">Year {index + 1}:</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder={`Cash Flow Year ${index + 1}`} {...formField} className="h-9 text-xs"/>
                          </FormControl>
                          <FormMessage className="text-xs"/>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
                  {(form.formState.errors.cashFlows && !Array.isArray(form.formState.errors.cashFlows)) && ( // Check if it's the root error
                      <p className="text-xs text-destructive mt-1.5">{(form.formState.errors.cashFlows as any).message || (form.formState.errors.cashFlows as any).root?.message}</p>
                  )}
              </div>
              <Alert variant="default" className="bg-accent/20 border-accent/50 p-3"> {/* Compact Alert */}
                  <Info className="h-4 w-4 !text-accent" />
                  <ShadcnAlertTitle className="text-accent font-semibold text-sm">Calculation Notes</ShadcnAlertTitle>
                  <AlertDescription className="text-accent/80 text-xs">
                      Enter positive values for cash inflows (profits) and negative for outflows (expenses).
                      Discount rate is often WACC. IRR not included in this version.
                  </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter className="flex flex-col items-stretch p-5 gap-4 border-t"> {/* Adjusted padding and gap */}
              <Button type="submit" size="default" className="h-10 text-sm font-semibold">
                <CalculatorIcon className="mr-1.5 h-4 w-4" /> Calculate ROI & View Details
              </Button>
              {results && (
                <div className="mt-2 p-3 border rounded-md bg-secondary/30 text-xs space-y-1">
                  <h3 className="font-semibold text-sm mb-1 text-foreground">Quick Summary:</h3>
                   <div className="flex justify-between"><span>NPV:</span> <span className={cn("font-semibold", results.npv >= 0 ? "text-green-600" : "text-red-600")}>{formatCurrency(results.npv)}</span></div>
                   <div className="flex justify-between"><span>Simple ROI:</span> <span className={cn("font-semibold", results.simpleRoi >= 0 ? "text-green-600" : "text-red-600")}>{isFinite(results.simpleRoi) ? `${results.simpleRoi.toFixed(1)}%` : "N/A"}</span></div>
                   <div className="flex justify-between"><span>Payback:</span> <span className="font-semibold text-foreground">{results.paybackPeriod}</span></div>
                </div>
              )}
              {form.formState.isSubmitted && Object.keys(form.formState.errors).length > 0 && !isModalOpen && (
                  <Alert variant="destructive" className="mt-2 p-3">
                      <AlertTriangle className="h-4 w-4" />
                      <ShadcnAlertTitle className="text-sm font-semibold">Validation Error</ShadcnAlertTitle>
                      <AlertDescription className="text-xs">Please correct the errors in the form.</AlertDescription>
                  </Alert>
              )}
            </CardFooter>
          </form>
        </Form>
      </Card>

      {results && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-xl md:max-w-2xl lg:max-w-3xl max-h-[85vh] flex flex-col p-0"> {/* Adjusted size, no padding on content itself */}
            <DialogHeader className="px-5 pt-4 pb-3 border-b"> {/* Consistent padding */}
              <DialogTitle className="text-lg flex items-center"> {/* Adjusted size */}
                <ReceiptText className="mr-2.5 h-5 w-5 text-primary"/>ROI Calculation Results
              </DialogTitle>
              <DialogDescription className="text-xs">
                Summary of your project's financial viability based on the provided inputs.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 py-4 px-5 flex-grow overflow-y-auto"> {/* Adjusted gap and padding */}
              <div className="md:col-span-2 space-y-3"> {/* Adjusted spacing */}
                <Card className="bg-secondary/30 shadow-none border-border/70"> {/* Subtle card */}
                  <CardHeader className='pb-1.5 pt-3 px-3'>
                    <CardTitle className='text-sm font-semibold'>Key Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 pb-3 space-y-2 text-xs"> {/* Compact content */}
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Net Present Value (NPV):</span>
                      <span className={cn("text-md font-semibold", results.npv >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
                        {formatCurrency(results.npv)}
                      </span>
                    </div>
                    <Separator className="my-1"/> {/* Reduced margin */}
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Simple ROI:</span>
                      <span className={cn("text-md font-semibold", results.simpleRoi >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
                        {isFinite(results.simpleRoi) ? `${results.simpleRoi.toFixed(2)}%` : "N/A (No Investment)"}
                      </span>
                    </div>
                    <Separator className="my-1"/>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Simple Payback Period:</span>
                      <span className="text-md font-semibold text-foreground">{results.paybackPeriod}</span>
                    </div>
                    <Separator className="my-1"/>
                     <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Total Net Profit (Undisc.):</span>
                      <span className="text-md font-semibold text-foreground">{formatCurrency(results.totalNetProfit, 0)}</span>
                    </div>
                    <Separator className="my-1"/>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Total Discounted CF:</span>
                      <span className="text-md font-semibold text-foreground">{formatCurrency(results.totalDiscountedCashFlow, 0)}</span>
                    </div>
                  </CardContent>
                </Card>
                 <AlertDescription className="text-xs text-muted-foreground p-2.5 border rounded-md bg-background">
                    <strong>NPV:</strong> Positive suggests worthwhile investment.
                    <br/>
                    <strong>Simple ROI:</strong> Basic profitability, ignores time value.
                    <br/>
                    <strong>Payback:</strong> Time to recoup initial investment (undiscounted).
                </AlertDescription>
              </div>

              <div className="md:col-span-3">
                 <Card className="h-full flex flex-col shadow-none border-border/70">
                    <CardHeader className="pb-1.5 pt-3 px-3">
                        <CardTitle className="text-sm font-semibold flex items-center"> <BarChart3 className="mr-1.5 h-4 w-4 text-accent"/>Cash Flow Analysis</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow px-1 pb-1"> {/* Reduced padding for chart */}
                        <RoiResultsChart
                            initialInvestment={form.getValues('initialInvestment')}
                            yearlyData={results.yearlyData}
                        />
                    </CardContent>
                 </Card>
              </div>
            </div>

            <DialogFooter className="px-5 pt-3 pb-4 border-t">
              <Button variant="outline" onClick={() => setIsModalOpen(false)} size="sm" className="h-9 text-xs">Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
