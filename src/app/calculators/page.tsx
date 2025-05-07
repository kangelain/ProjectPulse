
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectBudgetCalculator } from "@/components/calculators/project-budget-calculator";
import { RoiCalculator } from "@/components/calculators/roi-calculator";
import { Calculator as CalculatorIcon, DollarSign,TrendingUp } from 'lucide-react';

export default function CalculatorsPage() {
  return (
    <div className="container mx-auto py-8"> {/* Standardized container padding */}
      <div className="flex items-center mb-6"> {/* Reduced bottom margin */}
        <CalculatorIcon className="h-7 w-7 mr-2.5 text-primary" /> {/* Adjusted icon size and margin */}
        <h1 className="text-2xl font-semibold tracking-tight text-foreground"> {/* Adjusted font size */}
          Financial Calculators
        </h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6"> {/* Adjusted text size */}
        Utilize these tools for project financial planning and investment analysis.
      </p>

      <Tabs defaultValue="budget" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
          <TabsTrigger value="budget" className="text-xs py-2"> {/* Adjusted size */}
            <DollarSign className="mr-1.5 h-3.5 w-3.5" /> {/* Adjusted icon size */}
            Project Budget Calculator
          </TabsTrigger>
          <TabsTrigger value="roi" className="text-xs py-2">
            <TrendingUp className="mr-1.5 h-3.5 w-3.5" />
            ROI Calculator (DCF)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="budget" className="mt-4"> {/* Adjusted margin */}
          <ProjectBudgetCalculator />
        </TabsContent>

        <TabsContent value="roi" className="mt-4">
          <RoiCalculator />
        </TabsContent>
      </Tabs>
    </div>
  );
}
