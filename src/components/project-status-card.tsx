
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
  Activity, 
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
  'On Track': 'bg-green-500 hover:bg-green-600 text-white',
  'At Risk': 'bg-red-500 hover:bg-red-600 text-white',
  'Delayed': 'bg-yellow-500 hover:bg-yellow-600 text-black', // Ensure contrast for yellow
  'Completed': 'bg-blue-500 hover:bg-blue-600 text-white',
  'Planning': 'bg-gray-500 hover:bg-gray-600 text-white',
};

const priorityColors: Record<Project['priority'], string> = {
  High: 'border-red-600 text-red-700 dark:text-red-500 bg-red-100 dark:bg-red-900/30',
  Medium: 'border-yellow-600 text-yellow-700 dark:text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30',
  Low: 'border-green-600 text-green-700 dark:text-green-500 bg-green-100 dark:bg-green-900/30',
};

export function ProjectStatusCard({ project }: ProjectStatusCardProps) {
  const StatusIcon = statusIcons[project.status] || Activity;

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM d, yy'); // Shortened year
    } catch (error) {
      return 'N/A';
    }
  };
  
  const completedMilestones = project.keyMilestones.filter(m => m.status === 'Completed').length;
  const totalMilestones = project.keyMilestones.length;

  return (
    <Link href={`/projects/${project.id}`} className="block h-full group">
      <Card className="flex flex-col h-full shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out group-hover:border-primary/50">
        <CardHeader className="pb-3 pt-5 px-5">
          <div className="flex justify-between items-start gap-2">
            <CardTitle className="text-lg font-semibold text-primary leading-tight group-hover:text-primary/90 transition-colors">
              {project.name}
            </CardTitle>
            <Badge
              className={cn(
                'text-xs font-semibold shrink-0 px-2.5 py-1',
                statusColors[project.status]
              )}
            >
              <StatusIcon className="mr-1.5 h-3.5 w-3.5" />
              {project.status}
            </Badge>
          </div>
          <CardDescription className="text-sm pt-1.5 line-clamp-2 h-[40px] text-muted-foreground">
            {project.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow space-y-4 px-5 pb-4">
          <div>
            <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span className="font-medium text-foreground">{project.completionPercentage}%</span>
            </div>
            <Progress value={project.completionPercentage} aria-label={`${project.completionPercentage}% complete`} className="h-2.5"/>
          </div>
          
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
            {[
              { icon: CalendarDays, label: "Start", value: formatDate(project.startDate) },
              { icon: CalendarDays, label: "End", value: formatDate(project.endDate) },
              { icon: Users, label: "Lead", value: project.teamLead },
              { icon: Flag, label: "Priority", valueComponent: <Badge variant="outline" className={cn("ml-1 px-1.5 py-0.5 text-[0.7rem] leading-tight", priorityColors[project.priority])}>{project.priority}</Badge> },
              { icon: DollarSign, label: "Budget", value: `$${project.budget.toLocaleString()}` },
              { icon: ListChecks, label: "Milestones", value: `${completedMilestones}/${totalMilestones}` },
            ].map((item, index) => (
              <div key={index} className="flex items-center text-muted-foreground">
                <item.icon className="mr-1.5 h-3.5 w-3.5 text-accent flex-shrink-0" />
                <span className="font-medium text-foreground/80">{item.label}:</span>
                {item.value && <span className="ml-1 truncate">{item.value}</span>}
                {item.valueComponent}
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground pt-3 pb-4 px-5 border-t mt-auto">
          Last updated: {formatDate(project.lastUpdated)}
        </CardFooter>
      </Card>
    </Link>
  );
}
