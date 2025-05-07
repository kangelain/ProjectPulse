
'use client';

import { useState } from 'react';
import { ProjectStatusCard } from '@/components/project-status-card';
import { ProjectProgressChart } from '@/components/project-progress-chart';
import { ProjectTimelineGantt } from '@/components/project-timeline-gantt';
import { ProjectBudgetChart } from '@/components/project-budget-chart'; // Added import
import { mockProjects } from '@/lib/mock-data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { List, BarChart3, GanttChartSquare, Briefcase, PieChart } from 'lucide-react'; // Added PieChart icon

export default function HomePage() {
  const [selectedPortfolio, setSelectedPortfolio] = useState<string>('all');

  const portfolioNames = Array.from(new Set(mockProjects.map(p => p.portfolio))).sort();

  const filteredProjects = selectedPortfolio === 'all'
    ? mockProjects
    : mockProjects.filter(p => p.portfolio === selectedPortfolio);

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
        Project Dashboard
        {selectedPortfolio !== 'all' && (
          <span className="text-2xl text-muted-foreground"> - {selectedPortfolio}</span>
        )}
      </h1>
      <p className="text-muted-foreground mb-6">
        Overview of projects. Select a portfolio to filter the view or view the Gantt timeline.
      </p>

      <div className="mb-8">
        <Select onValueChange={setSelectedPortfolio} defaultValue="all">
          <SelectTrigger className="w-full sm:w-[320px]">
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
      </div>

      <Tabs defaultValue="cards" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-2 mb-6"> {/* Updated grid layout and added gap */}
          <TabsTrigger value="cards" className="text-sm">
            <List className="mr-2 h-4 w-4" /> Status Cards
          </TabsTrigger>
          <TabsTrigger value="charts" className="text-sm">
            <BarChart3 className="mr-2 h-4 w-4" /> Progress Charts
          </TabsTrigger>
          <TabsTrigger value="timeline" className="text-sm">
            <GanttChartSquare className="mr-2 h-4 w-4" /> Gantt Timelines
          </TabsTrigger>
          <TabsTrigger value="budget" className="text-sm"> {/* New Tab Trigger */}
            <PieChart className="mr-2 h-4 w-4" /> Budget Charts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cards">
          {filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <ProjectStatusCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-10">No projects found for the selected portfolio.</p>
          )}
        </TabsContent>

        <TabsContent value="charts">
          <div className="grid grid-cols-1 gap-6">
            <ProjectProgressChart projects={filteredProjects} />
          </div>
        </TabsContent>
        
        <TabsContent value="timeline">
          <div className="grid grid-cols-1 gap-6">
             <ProjectTimelineGantt projects={filteredProjects} />
          </div>
        </TabsContent>

        <TabsContent value="budget"> {/* New Tab Content */}
          <div className="grid grid-cols-1 gap-6">
             <ProjectBudgetChart projects={filteredProjects} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
