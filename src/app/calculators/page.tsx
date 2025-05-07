
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectBudgetCalculator } from "@/components/calculators/project-budget-calculator";
import { RoiCalculator } from "@/components/calculators/roi-calculator";
import { Calculator as CalculatorIcon, DollarSign,TrendingUp } from 'lucide-react';

export default function CalculatorsPage() {
  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center mb-8">
        <CalculatorIcon className="h-8 w-8 mr-3 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Financial Calculators
        </h1>
      </div>
      <p className="text-muted-foreground mb-6">
        Utilize these tools for project financial planning and investment analysis.
      </p>

      <Tabs defaultValue="budget" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
          <TabsTrigger value="budget" className="text-sm py-2.5">
            <DollarSign className="mr-2 h-4 w-4" />
            Project Budget Calculator
          </TabsTrigger>
          <TabsTrigger value="roi" className="text-sm py-2.5">
            <TrendingUp className="mr-2 h-4 w-4" />
            ROI Calculator (DCF)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="budget" className="mt-6">
          <ProjectBudgetCalculator />
        </TabsContent>

        <TabsContent value="roi" className="mt-6">
          <RoiCalculator />
        </TabsContent>
      </Tabs>
    </div>
  );
}
