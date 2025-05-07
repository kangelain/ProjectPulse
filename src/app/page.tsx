
'use client';

import { useState } from 'react';
import { ProjectStatusCard } from '@/components/project-status-card';
import { ProjectProgressChart } from '@/components/project-progress-chart';
import { ProjectTimelineGantt } from '@/components/project-timeline-gantt';
import { ProjectBudgetChart } from '@/components/project-budget-chart';
import { mockProjects } from '@/lib/mock-data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { List, BarChart3, GanttChartSquare, Briefcase, PieChart } from 'lucide-react';

export default function HomePage() {
  const [selectedPortfolio, setSelectedPortfolio] = useState<string>('all');

  const portfolioNames = Array.from(new Set(mockProjects.map(p => p.portfolio))).sort();

  const filteredProjects = selectedPortfolio === 'all'
    ? mockProjects
    : mockProjects.filter(p => p.portfolio === selectedPortfolio);

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
          Project Dashboard
        </h1>
        <p className="text-muted-foreground mb-6">
          Overview of projects. Select a portfolio to filter or view detailed timelines.
        </p>
      </div>
      

      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Select onValueChange={setSelectedPortfolio} defaultValue="all">
          <SelectTrigger className="w-full sm:w-[320px] text-sm">
            <div className="flex items-center">
              <Briefcase className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Select a portfolio" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Portfolios</SelectItem>
            {portfolioNames.map(portfolio => (
              <SelectItem key={portfolio} value={portfolio}>
                {portfolio}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedPortfolio !== 'all' && (
          <h2 className="text-xl font-semibold text-muted-foreground text-right">
            Viewing: {selectedPortfolio}
          </h2>
        )}
      </div>

      <Tabs defaultValue="cards" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
          <TabsTrigger value="cards" className="text-sm py-2.5">
            <List className="mr-2 h-4 w-4" /> Status Cards
          </TabsTrigger>
          <TabsTrigger value="charts" className="text-sm py-2.5">
            <BarChart3 className="mr-2 h-4 w-4" /> Progress Charts
          </TabsTrigger>
          <TabsTrigger value="timeline" className="text-sm py-2.5">
            <GanttChartSquare className="mr-2 h-4 w-4" /> Gantt Timelines
          </TabsTrigger>
          <TabsTrigger value="budget" className="text-sm py-2.5">
            <PieChart className="mr-2 h-4 w-4" /> Budget Charts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cards" className="mt-6">
          {filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <ProjectStatusCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
                <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-lg">No projects found for &quot;{selectedPortfolio}&quot;.</p>
                <p className="text-sm text-muted-foreground">Try selecting a different portfolio or &quot;All Portfolios&quot;.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="charts" className="mt-6">
          <div className="grid grid-cols-1 gap-6">
            <ProjectProgressChart projects={filteredProjects} />
          </div>
        </TabsContent>
        
        <TabsContent value="timeline" className="mt-6">
          <div className="grid grid-cols-1 gap-6">
             <ProjectTimelineGantt projects={filteredProjects} />
          </div>
        </TabsContent>

        <TabsContent value="budget" className="mt-6">
          <div className="grid grid-cols-1 gap-6">
             <ProjectBudgetChart projects={filteredProjects} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
