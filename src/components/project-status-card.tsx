
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

// Asana uses subtle status colors, often within text or small indicators.
// We will use a combination of background tints and text colors for clarity.
const statusStyles: Record<ProjectStatus, { badge: string, progress: string, text?: string }> = {
  'On Track': { badge: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700', progress: 'bg-green-500' },
  'At Risk': { badge: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700', progress: 'bg-red-500' },
  'Delayed': { badge: 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-600', progress: 'bg-yellow-500' },
  'Completed': { badge: 'bg-primary/10 text-primary border-primary/30', progress: 'bg-primary' },
  'Planning': { badge: 'bg-secondary text-secondary-foreground border-border', progress: 'bg-secondary-foreground' },
};

const priorityBadgeColors: Record<Project['priority'], string> = {
  High: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700',
  Medium: 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-600',
  Low: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
};


export function ProjectStatusCard({ project }: ProjectStatusCardProps) {
  const StatusIcon = statusIcons[project.status] || Activity;
  const currentStatusStyles = statusStyles[project.status] || statusStyles['Planning'];

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM d, yy'); 
    } catch (error) {
      return 'N/A';
    }
  };
  
  const completedMilestones = project.keyMilestones.filter(m => m.status === 'Completed').length;
  const totalMilestones = project.keyMilestones.length;

  return (
    <Link href={`/projects/${project.id}`} className="block h-full group">
      <Card className="flex flex-col h-full shadow-md hover:shadow-lg transition-shadow duration-200 ease-in-out group-hover:border-primary/40">
        <CardHeader className="pb-3 pt-4 px-4"> {/* Reduced padding */}
          <div className="flex justify-between items-start gap-2">
            <CardTitle className="text-md font-semibold text-foreground leading-tight group-hover:text-primary transition-colors line-clamp-1"> {/* Slightly smaller, line-clamp */}
              {project.name}
            </CardTitle>
            <Badge
              variant="outline"
              className={cn(
                'text-xs font-medium shrink-0 px-2 py-0.5', // Smaller padding
                currentStatusStyles.badge
              )}
            >
              <StatusIcon className="mr-1 h-3 w-3" /> {/* Slightly smaller icon */}
              {project.status}
            </Badge>
          </div>
          <CardDescription className="text-xs pt-1 line-clamp-2 h-[32px] text-muted-foreground"> {/* Smaller text, adjusted height */}
            {project.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow space-y-3 px-4 pb-3"> {/* Reduced padding and spacing */}
          <div>
            <div className="mb-1 flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span className="font-medium text-foreground">{project.completionPercentage}%</span>
            </div>
            <Progress value={project.completionPercentage} aria-label={`${project.completionPercentage}% complete`} className="h-2" indicatorClassName={currentStatusStyles.progress}/> {/* Slimmer progress bar */}
          </div>
          
          <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs"> {/* Reduced gaps */}
            {[
              { icon: CalendarDays, label: "Start", value: formatDate(project.startDate) },
              { icon: CalendarDays, label: "End", value: formatDate(project.endDate) },
              { icon: Users, label: "Lead", value: project.teamLead },
              { icon: Flag, label: "Priority", valueComponent: <Badge variant="outline" className={cn("ml-1 px-1.5 py-0 text-[0.65rem] leading-tight", priorityBadgeColors[project.priority])}>{project.priority}</Badge> }, // Use secondary for subtlety
              { icon: DollarSign, label: "Budget", value: `$${project.budget.toLocaleString()}` },
              { icon: ListChecks, label: "Milestones", value: `${completedMilestones}/${totalMilestones}` },
            ].map((item, index) => (
              <div key={index} className="flex items-center text-muted-foreground">
                <item.icon className="mr-1 h-3.5 w-3.5 text-muted-foreground/70 flex-shrink-0" /> {/* Consistent muted icon color */}
                <span className="font-medium text-foreground/80 mr-0.5">{item.label}:</span>
                {item.value && <span className="ml-0.5 truncate">{item.value}</span>}
                {item.valueComponent}
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground pt-2 pb-3 px-4 border-t mt-auto"> {/* Reduced padding */}
          Last updated: {formatDate(project.lastUpdated)}
        </CardFooter>
      </Card>
    </Link>
  );
}
