import { ProjectStatusCard } from '@/components/project-status-card';
import { ProjectProgressChart } from '@/components/project-progress-chart';
import { ProjectTimelineGantt } from '@/components/project-timeline-gantt';
import { mockProjects } from '@/lib/mock-data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { List, BarChart3, GanttChartSquare } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-foreground mb-8">
        Project Dashboard
      </h1>

      <Tabs defaultValue="cards" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 mb-6">
          <TabsTrigger value="cards" className="text-sm">
            <List className="mr-2 h-4 w-4" /> Status Cards
          </TabsTrigger>
          <TabsTrigger value="charts" className="text-sm">
            <BarChart3 className="mr-2 h-4 w-4" /> Progress Charts
          </TabsTrigger>
          <TabsTrigger value="timeline" className="text-sm">
            <GanttChartSquare className="mr-2 h-4 w-4" /> Timelines
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cards">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockProjects.map((project) => (
              <ProjectStatusCard key={project.id} project={project} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="charts">
          <div className="grid grid-cols-1 gap-6">
            <ProjectProgressChart projects={mockProjects} />
            {/* Add more charts here as needed, e.g., resource allocation, budget tracking */}
          </div>
        </TabsContent>
        
        <TabsContent value="timeline">
          <div className="grid grid-cols-1 gap-6">
             <ProjectTimelineGantt projects={mockProjects} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
