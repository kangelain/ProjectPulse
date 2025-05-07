
import type { Project, ProjectStatus } from '@/types/project';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  CalendarDays,
  Users,
  DollarSign,
  ListChecks,
  Flag,
  Activity, // For 'Planning' or a generic status icon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';

interface ProjectStatusCardProps {
  project: Project;
}

const statusIcons: Record<ProjectStatus, React.ElementType> = {
  'On Track': TrendingUp,
  'At Risk': AlertTriangle,
  'Delayed': Clock,
  'Completed': CheckCircle2,
  'Planning': Activity,
};

const statusColors: Record<ProjectStatus, string> = {
  'On Track': 'bg-green-500 hover:bg-green-600', // Custom color, not from theme directly for strong visual cue
  'At Risk': 'bg-red-500 hover:bg-red-600',
  'Delayed': 'bg-yellow-500 hover:bg-yellow-600',
  'Completed': 'bg-blue-500 hover:bg-blue-600',
  'Planning': 'bg-gray-500 hover:bg-gray-600',
};

const priorityColors: Record<Project['priority'], string> = {
  'High': 'border-red-500 text-red-700 dark:text-red-400',
  'Medium': 'border-yellow-500 text-yellow-700 dark:text-yellow-400',
  'Low': 'border-green-500 text-green-700 dark:text-green-400',
};

export function ProjectStatusCard({ project }: ProjectStatusCardProps) {
  const StatusIcon = statusIcons[project.status] || Activity;

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM dd, yyyy');
    } catch (error) {
      return 'N/A';
    }
  };
  
  const completedMilestones = project.keyMilestones.filter(m => m.status === 'Completed').length;
  const totalMilestones = project.keyMilestones.length;

  return (
    <Link href={`/projects/${project.id}`} className="block h-full">
      <Card className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg sm:text-xl font-semibold text-primary">{project.name}</CardTitle>
            <Badge
              className={cn(
                'text-xs font-semibold text-white shrink-0', // Ensure text is white for colored badges
                statusColors[project.status]
              )}
            >
              <StatusIcon className="mr-1.5 h-3.5 w-3.5" />
              {project.status}
            </Badge>
          </div>
          <CardDescription className="text-sm pt-1 line-clamp-2">{project.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow space-y-4">
          <div>
            <div className="mb-1 flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{project.completionPercentage}%</span>
            </div>
            <Progress value={project.completionPercentage} aria-label={`${project.completionPercentage}% complete`} className="h-2"/>
          </div>
          
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div className="flex items-center text-muted-foreground">
              <CalendarDays className="mr-2 h-4 w-4 text-accent" />
              <span>Start: {formatDate(project.startDate)}</span>
            </div>
            <div className="flex items-center text-muted-foreground">
              <CalendarDays className="mr-2 h-4 w-4 text-accent" />
              <span>End: {formatDate(project.endDate)}</span>
            </div>
            <div className="flex items-center text-muted-foreground">
              <Users className="mr-2 h-4 w-4 text-accent" />
              <span>Lead: {project.teamLead}</span>
            </div>
             <div className="flex items-center text-muted-foreground">
              <Flag className="mr-2 h-4 w-4 text-accent" />
              <span>Priority: 
                <Badge variant="outline" className={cn("ml-1", priorityColors[project.priority])}>
                  {project.priority}
                </Badge>
              </span>
            </div>
            <div className="flex items-center text-muted-foreground">
              <DollarSign className="mr-2 h-4 w-4 text-accent" />
              <span>Budget: ${project.budget.toLocaleString()}</span>
            </div>
            <div className="flex items-center text-muted-foreground">
              <ListChecks className="mr-2 h-4 w-4 text-accent" />
              <span>Milestones: {completedMilestones}/{totalMilestones}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground pt-4 border-t mt-auto">
          Last updated: {formatDate(project.lastUpdated)}
        </CardFooter>
      </Card>
    </Link>
  );
}
