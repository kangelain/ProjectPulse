'use client';

import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { mockProjects } from '@/lib/mock-data';
import type { Project, ProjectStatus } from '@/types/project';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, parseISO, differenceInDays, isValid, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DateRangePicker } from '@/components/date-range-picker';
import { ListChecks, Briefcase, Users, TrendingUp, PieChart, UsersRound, AlertTriangle, Clock, CheckCircle2, Activity, Loader2, Download, Mail, FileType, Search, Filter as FilterIcon, Check, XCircle, ChevronsUpDown, Brain, HelpCircle, LineChart as LineChartIcon, TrendingDown } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from "@/hooks/use-toast";
import { predictProjectPerformance, type PredictProjectPerformanceInput, type PredictProjectPerformanceOutput, type PortfolioMetricSummary } from '@/ai/flows/predict-project-performance-flow';
import { Alert, AlertDescription, AlertTitle as ShadcnAlertTitle } from '@/components/ui/alert';
import { FormControl } from '@/components/ui/form'; // Added for MultiSelectFilter


const statusStyles: Record<ProjectStatus, { badge: string, progress: string, text?: string }> = {
  'On Track': { badge: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700', progress: 'bg-green-500' },
  'At Risk': { badge: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700', progress: 'bg-red-500' },
  'Delayed': { badge: 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-600', progress: 'bg-yellow-500' },
  'Completed': { badge: 'bg-primary/10 text-primary border-primary/30', progress: 'bg-primary' },
  'Planning': { badge: 'bg-secondary text-secondary-foreground border-border', progress: 'bg-secondary-foreground' },
};

const priorityColors: Record<Project['priority'], string> = {
  High: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700',
  Medium: 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-600',
  Low: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
};

const statusIcons: Record<ProjectStatus, React.ElementType> = {
  'On Track': TrendingUp,
  'At Risk': AlertTriangle,
  'Delayed': Clock,
  'Completed': CheckCircle2,
  'Planning': Activity,
};

interface CalculatedProjectMetrics {
  daysRemaining: number;
  isOverdue: boolean;
  timelineProgress: number;
}

interface PortfolioSummary {
  portfolioName: string;
  totalProjects: number;
  averageCompletion: number;
  totalBudget: number;
  totalSpent: number;
  budgetVariance: number;
  statusCounts: Record<ProjectStatus, number>;
  projects: Project[];
}

interface TeamLeadWorkload {
  teamLead: string;
  projectCount: number;
  activeProjectsCount: number;
  completedProjectsCount: number;
  averageCompletionPercentage: number;
  totalBudgetManaged: number;
  statusDistribution: Record<ProjectStatus, number>;
  projects: Array<{ id: string; name: string; status: ProjectStatus, priority: Project['priority'], completionPercentage: number }>;
}

interface TrendIndicator {
  metricName: string;
  currentValue: string | number;
  trend: 'Improving' | 'Declining' | 'Stable' | 'N/A';
  trendDescription: string;
  historicalComparison?: string; 
}

const ALL_STATUSES = Object.keys(statusIcons) as ProjectStatus[];
const ALL_PRIORITIES = ['High', 'Medium', 'Low'] as Project['priority'][];


export default function ReportsPage() {
  const [projectMetrics, setProjectMetrics] = useState<Record<string, CalculatedProjectMetrics | null>>({});
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('performance');
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<Set<ProjectStatus>>(new Set());
  const [selectedPriorities, setSelectedPriorities] = useState<Set<Project['priority']>>(new Set());
  const [selectedTeamLeads, setSelectedTeamLeads] = useState<Set<string>>(new Set());
  const [selectedPortfolios, setSelectedPortfolios] = useState<Set<string>>(new Set());
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);
  const [selectedPortfolioForModal, setSelectedPortfolioForModal] = useState<PortfolioSummary | null>(null);

  const [trendsAndPredictions, setTrendsAndPredictions] = useState<PredictProjectPerformanceOutput | null>(null);
  const [isLoadingTrendsAndPredictions, setIsLoadingTrendsAndPredictions] = useState(false);
  const [trendsError, setTrendsError] = useState<string | null>(null);
  const [calculatedTrendIndicators, setCalculatedTrendIndicators] = useState<TrendIndicator[]>([]);

  const uniqueTeamLeads = useMemo(() => Array.from(new Set(mockProjects.map(p => p.teamLead))).sort(), []);
  const uniquePortfolios = useMemo(() => Array.from(new Set(mockProjects.map(p => p.portfolio))).sort(), []);

  useEffect(() => {
    if (mockProjects.length === 0) {
      setIsLoadingMetrics(false);
      return;
    }
    const metricsData: Record<string, CalculatedProjectMetrics | null> = {};
    const now = new Date();
    mockProjects.forEach(project => {
      try {
        const endDate = parseISO(project.endDate);
        const startDate = parseISO(project.startDate);
        if (!isValid(endDate) || !isValid(startDate)) throw new Error('Invalid date');

        const daysRemainingCalculated = differenceInDays(endDate, now);
        const isOverdueCalculated = daysRemainingCalculated < 0 && project.status !== 'Completed';

        const totalProjectDuration = differenceInDays(endDate, startDate);
        const daysPassed = Math.max(0, differenceInDays(now, startDate));
        
        let timelineProgressCalculated = 0;
        if (project.status === 'Completed') {
            timelineProgressCalculated = 100;
        } else if (totalProjectDuration > 0) {
            timelineProgressCalculated = Math.min(100, Math.max(0, (daysPassed / totalProjectDuration) * 100));
        }

        metricsData[project.id] = {
          daysRemaining: daysRemainingCalculated,
          isOverdue: isOverdueCalculated,
          timelineProgress: timelineProgressCalculated,
        };
      } catch (e) {
        console.error(`Error calculating metrics for project ${project.id}:`, e);
        metricsData[project.id] = null;
      }
    });
    setProjectMetrics(metricsData);
    setIsLoadingMetrics(false);
  }, []);


  const filteredProjects = useMemo(() => {
    return mockProjects.filter(project => {
      const matchesSearch = searchTerm === '' ||
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.teamLead.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = selectedStatuses.size === 0 || selectedStatuses.has(project.status);
      const matchesPriority = selectedPriorities.size === 0 || selectedPriorities.has(project.priority);
      const matchesTeamLead = selectedTeamLeads.size === 0 || selectedTeamLeads.has(project.teamLead);
      const matchesPortfolio = selectedPortfolios.size === 0 || selectedPortfolios.has(project.portfolio);
      
      let matchesDateRange = true;
      if (dateRange?.from && dateRange?.to) {
        try {
            const projectStartDate = parseISO(project.startDate);
             if (!isValid(projectStartDate)) throw new Error('Invalid project start date');
            matchesDateRange = isWithinInterval(projectStartDate, { start: startOfDay(dateRange.from), end: endOfDay(dateRange.to) });
        } catch { matchesDateRange = false; }
      } else if (dateRange?.from) {
         try {
            const projectStartDate = parseISO(project.startDate);
            if (!isValid(projectStartDate)) throw new Error('Invalid project start date');
            matchesDateRange = projectStartDate >= startOfDay(dateRange.from);
        } catch { matchesDateRange = false; }
      }

      return matchesSearch && matchesStatus && matchesPriority && matchesTeamLead && matchesPortfolio && matchesDateRange;
    });
  }, [searchTerm, selectedStatuses, selectedPriorities, selectedTeamLeads, selectedPortfolios, dateRange]);


  const portfolioSummaries = useMemo<PortfolioSummary[]>(() => {
    const portfoliosMap: Record<string, PortfolioSummary> = {};
    filteredProjects.forEach(p => {
      if (!portfoliosMap[p.portfolio]) {
        portfoliosMap[p.portfolio] = {
          portfolioName: p.portfolio,
          totalProjects: 0,
          averageCompletion: 0,
          totalBudget: 0,
          totalSpent: 0,
          budgetVariance: 0,
          statusCounts: { 'On Track': 0, 'At Risk': 0, 'Delayed': 0, 'Completed': 0, 'Planning': 0 },
          projects: [],
        };
      }
      const summary = portfoliosMap[p.portfolio];
      summary.totalProjects++;
      summary.averageCompletion += p.completionPercentage;
      summary.totalBudget += p.budget;
      summary.totalSpent += p.spent;
      summary.statusCounts[p.status]++;
      summary.projects.push(p);
    });

    return Object.values(portfoliosMap).map(s => ({
      ...s,
      averageCompletion: s.totalProjects > 0 ? parseFloat((s.averageCompletion / s.totalProjects).toFixed(2)) : 0,
      budgetVariance: s.totalBudget - s.totalSpent,
    })).sort((a,b) => a.portfolioName.localeCompare(b.portfolioName));
  }, [filteredProjects]);

  const teamLeadWorkloads = useMemo<TeamLeadWorkload[]>(() => {
    const leadsMap: Record<string, TeamLeadWorkload> = {};
    filteredProjects.forEach(p => {
      if (!leadsMap[p.teamLead]) {
        leadsMap[p.teamLead] = {
          teamLead: p.teamLead,
          projectCount: 0,
          activeProjectsCount: 0,
          completedProjectsCount: 0,
          averageCompletionPercentage: 0,
          totalBudgetManaged: 0,
          statusDistribution: { 'On Track': 0, 'At Risk': 0, 'Delayed': 0, 'Completed': 0, 'Planning': 0 },
          projects: [],
        };
      }
      const leadSummary = leadsMap[p.teamLead];
      leadSummary.projectCount++;
      leadSummary.totalBudgetManaged += p.budget;
      leadSummary.statusDistribution[p.status]++;
      if (p.status !== 'Completed') {
        leadSummary.activeProjectsCount++;
        leadSummary.averageCompletionPercentage += p.completionPercentage;
      } else {
        leadSummary.completedProjectsCount++;
      }
      leadSummary.projects.push({ id: p.id, name: p.name, status: p.status, priority: p.priority, completionPercentage: p.completionPercentage });
    });

    return Object.values(leadsMap).map(lead => ({
      ...lead,
      averageCompletionPercentage: lead.activeProjectsCount > 0 ? parseFloat((lead.averageCompletionPercentage / lead.activeProjectsCount).toFixed(2)) : 0,
    })).sort((a,b) => b.projectCount - a.projectCount);
  }, [filteredProjects]);


   const calculateTrendIndicators = (projects: Project[]): { completionTrend: 'Improving' | 'Declining' | 'Stable', budgetTrend: 'Improving' | 'Worsening' | 'Stable' } => {
    if (projects.length < 5) return { completionTrend: 'Stable', budgetTrend: 'Stable' }; 

    const sortedByStartDate = [...projects].sort((a, b) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime());
    const olderProjects = sortedByStartDate.slice(0, Math.floor(sortedByStartDate.length / 2));
    const newerProjects = sortedByStartDate.slice(Math.ceil(sortedByStartDate.length / 2));

    const avgCompletionOlder = olderProjects.reduce((sum, p) => sum + p.completionPercentage, 0) / (olderProjects.length || 1);
    const avgCompletionNewer = newerProjects.reduce((sum, p) => sum + p.completionPercentage, 0) / (newerProjects.length || 1);

    const budgetRatio = (p: Project) => p.budget > 0 ? p.spent / p.budget : 1; 
    const avgBudgetRatioOlder = olderProjects.reduce((sum, p) => sum + budgetRatio(p), 0) / (olderProjects.length || 1);
    const avgBudgetRatioNewer = newerProjects.reduce((sum, p) => sum + budgetRatio(p), 0) / (newerProjects.length || 1);
    
    let completionTrend: 'Improving' | 'Declining' | 'Stable' = 'Stable';
    if (avgCompletionNewer > avgCompletionOlder * 1.05) completionTrend = 'Improving';
    else if (avgCompletionNewer < avgCompletionOlder * 0.95) completionTrend = 'Declining';

    let budgetTrend: 'Improving' | 'Worsening' | 'Stable' = 'Stable';
    if (avgBudgetRatioNewer < avgBudgetRatioOlder * 0.95) budgetTrend = 'Improving'; 
    else if (avgBudgetRatioNewer > avgBudgetRatioOlder * 1.05) budgetTrend = 'Worsening';

    setCalculatedTrendIndicators([
        { metricName: 'Overall Completion', currentValue: `${avgCompletionNewer.toFixed(1)}%`, trend: completionTrend, trendDescription: `Completion: ${completionTrend}`, historicalComparison: `Older: ${avgCompletionOlder.toFixed(1)}%` },
        { metricName: 'Overall Budget Adherence', currentValue: `${avgBudgetRatioNewer.toFixed(2)} ratio`, trend: budgetTrend, trendDescription: `Budget: ${budgetTrend}`, historicalComparison: `Older: ${avgBudgetRatioOlder.toFixed(2)} ratio` },
    ]);

    return { completionTrend, budgetTrend };
  };

  const fetchTrendsAndPredictions = async () => {
    if (filteredProjects.length === 0) {
      setTrendsAndPredictions(null);
      setTrendsError("No project data to analyze for predictions.");
      setCalculatedTrendIndicators([]);
      return;
    }
    setIsLoadingTrendsAndPredictions(true);
    setTrendsError(null);
    try {
      const overallAvgCompletion = filteredProjects.reduce((sum, p) => sum + p.completionPercentage, 0) / filteredProjects.length;
      const totalBudget = filteredProjects.reduce((sum, p) => sum + p.budget, 0);
      const totalSpent = filteredProjects.reduce((sum, p) => sum + p.spent, 0);
      const overallBudgetVarRatio = totalBudget > 0 ? totalSpent / totalBudget : 1;
      
      const aiPortfolioSummaries: PortfolioMetricSummary[] = portfolioSummaries
        .sort((a,b) => b.totalProjects - a.totalProjects) 
        .slice(0, 5)
        .map(ps => ({
            portfolioName: ps.portfolioName,
            totalProjects: ps.totalProjects,
            averageCompletion: ps.averageCompletion,
            budgetVarianceRatio: ps.totalBudget > 0 ? ps.totalSpent / ps.totalBudget : 1,
            onTrackProjects: ps.statusCounts['On Track'] || 0,
            atRiskProjects: ps.statusCounts['At Risk'] || 0,
            delayedProjects: ps.statusCounts['Delayed'] || 0,
      }));

      const recentTrendIndicators = calculateTrendIndicators(filteredProjects);

      const input: PredictProjectPerformanceInput = {
        overallAverageCompletion: parseFloat(overallAvgCompletion.toFixed(2)),
        overallBudgetVarianceRatio: parseFloat(overallBudgetVarRatio.toFixed(2)),
        portfolioSummaries: aiPortfolioSummaries,
        recentTrendIndicators: recentTrendIndicators,
      };
      
      const result = await predictProjectPerformance(input);
      setTrendsAndPredictions(result);
    } catch (err) {
      console.error('Error fetching trends and predictions:', err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred while fetching AI insights.";
      setTrendsError(errorMessage);
      toast({ title: "AI Prediction Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoadingTrendsAndPredictions(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'trends') {
      fetchTrendsAndPredictions();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, filteredProjects]); 

  
  function handleFilterToggle<T>(
    set: Set<T>,
    item: T,
    setter: React.Dispatch<React.SetStateAction<Set<T>>>
  ) {
    const newSet = new Set(set);
    if (newSet.has(item)) {
      newSet.delete(item);
    } else {
      newSet.add(item);
    }
    setter(newSet);
  }
  
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedStatuses(new Set());
    setSelectedPriorities(new Set());
    setSelectedTeamLeads(new Set());
    setSelectedPortfolios(new Set());
    setDateRange(undefined);
  };

  const formatDate = (dateString: string, csvFormat = false) => {
    try {
        const parsedDate = parseISO(dateString);
        if (!isValid(parsedDate)) return 'N/A';
        return format(parsedDate, csvFormat ? 'yyyy-MM-dd' : 'MMM dd, yyyy');
    } catch (error) {
        return 'N/A';
    }
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  }

  const escapeCsvValue = (value: any): string => {
    const stringValue = String(value == null ? '' : value);
    if (/[",\r\n]/.test(stringValue)) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };
  
  const escapeHtml = (unsafe: string | number | null | undefined): string => {
    if (unsafe === null || unsafe === undefined) return '';
    return String(unsafe)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const downloadCSV = (csvString: string, filename: string) => {
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
       toast({ title: "CSV Downloaded", description: `${filename} has been downloaded.`, variant: "default" });
    } else {
        toast({ title: "Download Failed", description: "Your browser does not support this download method.", variant: "destructive" });
    }
  };

  const handleDownloadPerformanceCSV = () => {
    const headers = [
      "Project Name", "Status", "Priority", "Completion %",
      "Budget (USD)", "Spent (USD)", "Variance (USD)",
      "Start Date", "End Date", "Days Remaining/Overdue", "Team Lead", "Portfolio"
    ];

    const rows = filteredProjects.map(project => {
      const metrics = projectMetrics[project.id];
      let daysRemainingDisplay = 'N/A';
      if (metrics) {
        if (project.status === 'Completed') {
          daysRemainingDisplay = 'Completed';
        } else if (metrics.isOverdue) {
          daysRemainingDisplay = `${Math.abs(metrics.daysRemaining)} days overdue`;
        } else {
          daysRemainingDisplay = `${metrics.daysRemaining} days remaining`;
        }
      }
      
      return [
        escapeCsvValue(project.name),
        escapeCsvValue(project.status),
        escapeCsvValue(project.priority),
        escapeCsvValue(project.completionPercentage),
        escapeCsvValue(project.budget),
        escapeCsvValue(project.spent),
        escapeCsvValue(project.budget - project.spent),
        escapeCsvValue(formatDate(project.startDate, true)),
        escapeCsvValue(formatDate(project.endDate, true)),
        escapeCsvValue(daysRemainingDisplay),
        escapeCsvValue(project.teamLead),
        escapeCsvValue(project.portfolio),
      ].join(',');
    });

    const csvString = [headers.join(','), ...rows].join('\r\n');
    downloadCSV(csvString, "project_performance_report_filtered.csv");
  };

  const handleDownloadPortfolioSummariesCSV = () => {
    const headers = [
      "Portfolio Name", "Total Projects", "Average Completion (%)", 
      "Total Budget (USD)", "Total Spent (USD)", "Budget Variance (USD)",
      "Status On Track", "Status At Risk", "Status Delayed", "Status Completed", "Status Planning"
    ];
    const rows = portfolioSummaries.map(summary => [
      escapeCsvValue(summary.portfolioName),
      escapeCsvValue(summary.totalProjects),
      escapeCsvValue(summary.averageCompletion),
      escapeCsvValue(summary.totalBudget),
      escapeCsvValue(summary.totalSpent),
      escapeCsvValue(summary.budgetVariance),
      escapeCsvValue(summary.statusCounts['On Track']),
      escapeCsvValue(summary.statusCounts['At Risk']),
      escapeCsvValue(summary.statusCounts['Delayed']),
      escapeCsvValue(summary.statusCounts['Completed']),
      escapeCsvValue(summary.statusCounts['Planning']),
    ].join(','));
    const csvString = [headers.join(','), ...rows].join('\r\n');
    downloadCSV(csvString, "portfolio_summaries_report.csv");
  };

  const handleDownloadTeamOverviewCSV = () => {
    const headers = [
      "Team Lead", "Total Projects (Filtered)", "Active Projects", "Completed Projects",
      "Avg. Active Completion (%)", "Total Budget Managed (USD)",
      "Active: On Track", "Active: At Risk", "Active: Delayed", "Active: Planning"
    ];
    const rows = teamLeadWorkloads.map(lead => [
      escapeCsvValue(lead.teamLead),
      escapeCsvValue(lead.projectCount),
      escapeCsvValue(lead.activeProjectsCount),
      escapeCsvValue(lead.completedProjectsCount),
      escapeCsvValue(lead.averageCompletionPercentage),
      escapeCsvValue(lead.totalBudgetManaged),
      escapeCsvValue(lead.statusDistribution['On Track']),
      escapeCsvValue(lead.statusDistribution['At Risk']),
      escapeCsvValue(lead.statusDistribution['Delayed']),
      escapeCsvValue(lead.statusDistribution['Planning']),
    ].join(','));
    const csvString = [headers.join(','), ...rows].join('\r\n');
    downloadCSV(csvString, "team_overview_report.csv");
  };


  const generateReportHTML = (tab: string): string => {
    let html = `<html><head><meta charset="UTF-8"><style>
      body { font-family: Helvetica, Arial, sans-serif; font-size: 10pt; color: #333; margin: 20px; }
      table { border-collapse: collapse; width: 100%; margin-bottom: 20px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
      th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; vertical-align: top; font-size: 0.9em; } /* Smaller padding & font */
      th { background-color: #f8fafc; color: #4a5568; font-weight: 600; text-transform: uppercase; font-size: 0.8em;} /* Smaller font */
      tr:nth-child(even) { background-color: #f7fafc; }
      tr:hover { background-color: #edf2f7; }
      .currency { text-align: right; } .percentage { text-align: right; }
      .status-on-track { color: #38a169; } .status-at-risk { color: #e53e3e; } .status-delayed { color: #dd6b20; }
      .status-completed { color: #3182ce; } .status-planning { color: #718096; }
      .priority-high { color: #c53030; } .priority-medium { color: #d69e2e; } .priority-low { color: #2f855a; }
      .variance-positive { color: #38a169; } .variance-negative { color: #e53e3e; }
      h1 { font-size: 1.6em; color: #2d3748; margin-bottom: 0.5em; } /* Adjusted size */
      h2 { font-size: 1.2em; color: #4a5568; margin-bottom: 0.5em; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.3em; } /* Adjusted size */
      .card { border: 1px solid #e2e8f0; border-radius: 0.375rem; padding: 1rem; margin-bottom: 1rem; background-color: #fff; box-shadow: 0 1px 2px rgba(0,0,0,0.05); display: inline-block; width: calc(33% - 1.5rem); vertical-align: top; margin-right: 1rem; box-sizing: border-box;} /* Adjusted padding and width calc */
      .flex-container { display: flex; flex-wrap: wrap; gap: 1rem; }
      .progress-bar { background-color: #e2e8f0; border-radius: 0.25rem; height: 0.4rem; overflow: hidden; margin-top: 0.25rem; } /* Slimmer progress bar */
      .progress-bar-inner { background-color: #4299e1; height: 100%; }
      .filter-info { margin-bottom: 15px; padding: 8px; background-color: #f9f9f9; border: 1px solid #eee; border-radius: 4px; font-size: 0.85em;} /* Smaller padding and font */
      .trend-improving { color: #38a169; } .trend-declining { color: #e53e3e; } .trend-stable { color: #718096; }
      .confidence-high { font-weight: bold; color: #2f855a; } .confidence-medium { color: #d69e2e; } .confidence-low { color: #a0aec0; }
      .card-title { font-size: 1.1em; font-weight: 600; margin-bottom: 0.3em; } /* Card title styling */
      .card-description { font-size: 0.85em; color: #718096; margin-bottom: 0.8em; }
      ul { padding-left: 20px; margin-top: 0.3em; } li { margin-bottom: 0.2em; }
    </style></head><body><h1>ProjectPulse Report - ${escapeHtml(tab.charAt(0).toUpperCase() + tab.slice(1))}</h1>`;

    html += `<div class="filter-info"><strong>Filters Applied:</strong><br/>`;
    if (searchTerm) html += `Search: "${escapeHtml(searchTerm)}"<br/>`;
    if (selectedStatuses.size > 0) html += `Status: ${escapeHtml(Array.from(selectedStatuses).join(', '))}<br/>`;
    if (selectedPriorities.size > 0) html += `Priority: ${escapeHtml(Array.from(selectedPriorities).join(', '))}<br/>`;
    if (selectedTeamLeads.size > 0) html += `Team Lead: ${escapeHtml(Array.from(selectedTeamLeads).join(', '))}<br/>`;
    if (selectedPortfolios.size > 0) html += `Portfolio: ${escapeHtml(Array.from(selectedPortfolios).join(', '))}<br/>`;
    if (dateRange?.from) html += `Start Date From: ${escapeHtml(formatDate(dateRange.from.toISOString()))}${dateRange.to ? ` To: ${escapeHtml(formatDate(dateRange.to.toISOString()))}` : ''}<br/>`;
    if (!searchTerm && selectedStatuses.size === 0 && selectedPriorities.size === 0 && selectedTeamLeads.size === 0 && selectedPortfolios.size === 0 && !dateRange?.from) html += 'None';
    html += `</div>`;


    if (tab === 'performance') {
      html += `<h2>Project Performance Details (${filteredProjects.length} projects)</h2><table>
        <thead><tr><th>Project Name</th><th>Status</th><th>Priority</th><th>Completion %</th><th>Budget</th><th>Spent</th><th>Variance</th><th>Start Date</th><th>End Date</th><th>Timeline</th><th>Team Lead</th><th>Portfolio</th></tr></thead>
        <tbody>`;
      filteredProjects.forEach(project => {
        const metrics = projectMetrics[project.id];
        let daysRemainingDisplay = 'N/A';
        if (metrics) {
          if (project.status === 'Completed') daysRemainingDisplay = '<span class="status-completed">Completed</span>';
          else if (metrics.isOverdue) daysRemainingDisplay = `<span class="status-at-risk">${Math.abs(metrics.daysRemaining)} days overdue</span>`;
          else daysRemainingDisplay = `${metrics.daysRemaining} days left`;
        }
        const variance = project.budget - project.spent;
        html += `<tr>
          <td>${escapeHtml(project.name)}</td>
          <td class="status-${project.status.toLowerCase().replace(' ', '-')}">${escapeHtml(project.status)}</td>
          <td class="priority-${project.priority.toLowerCase()}">${escapeHtml(project.priority)}</td>
          <td class="percentage">${escapeHtml(project.completionPercentage)}%</td>
          <td class="currency">${escapeHtml(formatCurrency(project.budget))}</td>
          <td class="currency">${escapeHtml(formatCurrency(project.spent))}</td>
          <td class="currency ${variance >= 0 ? 'variance-positive' : 'variance-negative'}">${escapeHtml(formatCurrency(variance))}</td>
          <td>${escapeHtml(formatDate(project.startDate))}</td>
          <td>${escapeHtml(formatDate(project.endDate))}</td>
          <td>${daysRemainingDisplay}</td>
          <td>${escapeHtml(project.teamLead)}</td>
          <td>${escapeHtml(project.portfolio)}</td>
        </tr>`;
      });
      html += `</tbody></table>`;
    } else if (tab === 'portfolio') {
      html += `<h2>Portfolio Summaries</h2><div class="flex-container">`;
      portfolioSummaries.forEach(summary => {
        html += `<div class="card">
          <div class="card-title">${escapeHtml(summary.portfolioName)}</div>
          <div class="card-description">${escapeHtml(summary.totalProjects)} projects</div>
          <p><strong>Avg. Completion:</strong> ${escapeHtml(summary.averageCompletion)}%
            <div class="progress-bar"><div class="progress-bar-inner" style="width:${summary.averageCompletion}%"></div></div>
          </p>
          <p><strong>Budget:</strong> ${escapeHtml(formatCurrency(summary.totalBudget))}</p>
          <p><strong>Spent:</strong> ${escapeHtml(formatCurrency(summary.totalSpent))}</p>
          <p><strong>Variance:</strong> <span class="${summary.budgetVariance >= 0 ? 'variance-positive' : 'variance-negative'}">${escapeHtml(formatCurrency(summary.budgetVariance))}</span></p>
          <p><strong>Status Breakdown:</strong></p><ul>`;
        Object.entries(summary.statusCounts).forEach(([status, count]) => {
          if (count > 0) html += `<li>${escapeHtml(status)}: ${escapeHtml(count)}</li>`;
        });
        html += `</ul></div>`;
      });
      if (portfolioSummaries.length === 0) html += '<p>No portfolio data for current filters.</p>';
      html += `</div>`;
    } else if (tab === 'resources') {
      html += `<h2>Team Overview & Workload</h2><table>
        <thead><tr><th>Team Lead</th><th>Projects (Filtered)</th><th>Active</th><th>Completed</th><th>Avg. Active Comp. %</th><th>Budget Managed</th><th>Active Statuses</th></tr></thead>
        <tbody>`;
      teamLeadWorkloads.forEach(lead => {
        let statusDistHtml = Object.entries(lead.statusDistribution)
            .filter(([status, count]) => status !== 'Completed' && count > 0)
            .map(([status, count]) => `${escapeHtml(status)}: ${count}`)
            .join(', ');
        if (!statusDistHtml) statusDistHtml = 'N/A';
        
        html += `<tr>
          <td>${escapeHtml(lead.teamLead)}</td>
          <td style="text-align:center;">${escapeHtml(lead.projectCount)}</td>
          <td style="text-align:center;">${escapeHtml(lead.activeProjectsCount)}</td>
          <td style="text-align:center;">${escapeHtml(lead.completedProjectsCount)}</td>
          <td class="percentage">${escapeHtml(lead.averageCompletionPercentage)}%</td>
          <td class="currency">${escapeHtml(formatCurrency(lead.totalBudgetManaged))}</td>
          <td>${statusDistHtml}</td>
        </tr>`;
      });
      if (teamLeadWorkloads.length === 0) html += '<tr><td colspan="7" style="text-align:center;">No team lead data for current filters.</td></tr>';
      html += `</tbody></table>`;
    } else if (tab === 'trends') {
       html += `<h2>Trends & AI Predictions</h2>`;
       html += `<h3>Calculated Trend Indicators (based on current filtered data)</h3><div class="flex-container">`;
       calculatedTrendIndicators.forEach(trend => {
           html += `<div class="card" style="width: calc(50% - 1.5rem);">
             <p><strong>Metric:</strong> ${escapeHtml(trend.metricName)}</p>
             <p><strong>Current Value:</strong> ${escapeHtml(trend.currentValue)}</p>
             <p><strong>Trend:</strong> <span class="trend-${trend.trend.toLowerCase()}">${escapeHtml(trend.trendDescription)}</span></p>
             ${trend.historicalComparison ? `<p><small>Comparison: ${escapeHtml(trend.historicalComparison)}</small></p>` : ''}
           </div>`;
       });
       if (calculatedTrendIndicators.length === 0) html += '<p>Not enough data to calculate simple trends.</p>';
       html += `</div>`;

       html += `<h3 style="margin-top: 20px;">AI-Powered Predictions & Insights</h3>`;
       if (isLoadingTrendsAndPredictions) {
           html += `<p>Loading AI predictions...</p>`;
       } else if (trendsError) {
           html += `<p style="color: red;">Error fetching AI predictions: ${escapeHtml(trendsError)}</p>`;
       } else if (trendsAndPredictions && trendsAndPredictions.predictions.length > 0) {
           html += `<div class="flex-container">`;
           trendsAndPredictions.predictions.forEach(pred => {
               html += `<div class="card" style="width: calc(50% - 1.5rem);">
                   <p><strong>Area:</strong> ${escapeHtml(pred.area)}</p>
                   <p><strong>Prediction:</strong> ${escapeHtml(pred.prediction)}</p>
                   <p><strong>Confidence:</strong> <span class="confidence-${pred.confidence.toLowerCase()}">${escapeHtml(pred.confidence)}</span></p>
                   ${pred.suggestion ? `<p><strong>Suggestion:</strong> ${escapeHtml(pred.suggestion)}</p>` : ''}
               </div>`;
           });
           html += `</div>`;
       } else {
           html += `<p>No AI predictions available at the moment. Try adjusting filters or check back later.</p>`;
       }
    }
    html += `</body></html>`;
    return html;
  };

  const handleShareViaEmail = () => {
    const reportHtml = generateReportHTML(activeTab);
    const subject = `ProjectPulse Report: ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} (Filtered)`;
    
    let body = `Please find the ${activeTab} report attached or viewable in rich HTML format if your client supports it. This report reflects the currently applied filters.`;
    let mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    if (navigator.clipboard && typeof ClipboardItem !== "undefined") {
        try {
            const blobHtml = new Blob([reportHtml], { type: 'text/html' });
            const clipboardItem = new ClipboardItem({ 'text/html': blobHtml });
            navigator.clipboard.write([clipboardItem]).then(() => {
                 toast({
                    title: "Report Copied to Clipboard",
                    description: "The HTML report has been copied. You can paste it into your email body.",
                    variant: "default",
                    duration: 7000,
                  });
                 window.location.href = mailtoLink;
            }).catch(err => {
                console.warn("Could not copy HTML to clipboard, falling back to simple mailto:", err);
                if (encodeURIComponent(reportHtml).length < 1800) { 
                     mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(reportHtml)}`;
                }
                window.location.href = mailtoLink;
            });
        } catch(e) { 
            console.warn("ClipboardItem approach failed:", e);
            if (encodeURIComponent(reportHtml).length < 1800) {
                 mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(reportHtml)}`;
            }
            window.location.href = mailtoLink;
        }
    } else {
        if (encodeURIComponent(reportHtml).length < 1800) { 
            mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(reportHtml)}`;
        } else {
             toast({
                title: "Email Content Too Long for Direct Link",
                description: "The HTML report is too large for a direct email link. Please download CSV and attach it, or try copying the report if your browser supports it.",
                variant: "destructive",
                duration: 9000,
              });
              return; 
        }
        window.location.href = mailtoLink;
    }
  };

  const handleDownloadPDF = () => {
    const reportHtml = generateReportHTML(activeTab);
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(reportHtml);
        printWindow.document.close(); 
        
        setTimeout(() => {
            printWindow.print();
        }, 500); 
        toast({
            title: "Print to PDF",
            description: "Your browser's print dialog should appear. Choose 'Save as PDF' or your PDF printer.",
            variant: "default",
            duration: 8000
        });
    } else {
        toast({
            title: "PDF Generation Failed",
            description: "Could not open print window. Please check your browser's pop-up settings.",
            variant: "destructive"
        });
    }
};


  const MultiSelectFilter = ({ title, options, selectedValues, onValueChange }: { title: string, options: readonly string[], selectedValues: Set<string>, onValueChange: (item: string) => void }) => {
    const [open, setOpen] = React.useState(false);
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <FormControl>
            <Button variant="outline" role="combobox" aria-expanded={open} className="w-full sm:w-[180px] justify-between h-9 text-xs px-3"> <div className="flex items-center">
                <FilterIcon className="mr-1.5 h-3.5 w-3.5 shrink-0 opacity-50" /> 
                {title}
              </div>
              <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" /> 
            </Button>
          </FormControl>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput placeholder={`Search ${title.toLowerCase()}...`} className="text-xs h-9" /> 
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option}
                    onSelect={() => {
                      onValueChange(option);
                    }}
                    className="text-xs py-1.5" >
                    {option}
                  </CommandItem>
                ))}
              </CommandGroup>
              {selectedValues.size > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => {
                        if (title === 'Status') setSelectedStatuses(new Set());
                        if (title === 'Priority') setSelectedPriorities(new Set());
                        if (title === 'Team Lead') setSelectedTeamLeads(new Set());
                        if (title === 'Portfolio') setSelectedPortfolios(new Set());
                      }}
                      className="justify-center text-center text-xs text-muted-foreground py-1.5" >Clear selection
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  };


  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
        <div className="flex items-center">
          <LineChartIcon className="h-7 w-7 mr-2.5 text-primary shrink-0" /> 
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Advanced Reporting</h1> 
            <p className="text-xs text-muted-foreground">Analyze project data with advanced filters, trends, and export options.</p> 
          </div>
        </div>
         <div className="flex gap-2 flex-wrap sm:flex-nowrap">
            <Button onClick={() => {
                if (activeTab === 'performance') handleDownloadPerformanceCSV();
                else if (activeTab === 'portfolio') handleDownloadPortfolioSummariesCSV();
                else if (activeTab === 'resources') handleDownloadTeamOverviewCSV();
                else if (activeTab === 'trends') toast({ title: "CSV Export N/A", description: "AI predictions are best viewed online or in HTML format.", variant: "default"});
                else toast({ title: "CSV Export", description: `CSV export is not available for this tab.`, variant: "default" });
            }} size="sm" variant="outline" title="Download current view as CSV" className="h-9 px-3 text-xs"> 
                <Download className="mr-1.5 h-3.5 w-3.5" /> CSV 
            </Button>
            <Button onClick={handleDownloadPDF} size="sm" variant="outline" title="Download current view as PDF (via Print)" className="h-9 px-3 text-xs">
                <FileType className="mr-1.5 h-3.5 w-3.5" /> PDF
            </Button>
            <Button onClick={handleShareViaEmail} size="sm" variant="outline" title="Share current view via Email" className="h-9 px-3 text-xs">
                <Mail className="mr-1.5 h-3.5 w-3.5" /> Share
            </Button>
        </div>
      </div>
      
      <Card className="mb-6 shadow-md"> 
        <CardHeader className="pb-3 pt-4 px-4"> 
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5"> 
            <CardTitle className="text-md font-semibold">Filter Options</CardTitle> 
            <Button variant="ghost" size="sm" onClick={resetFilters} className="text-xs text-muted-foreground hover:text-primary h-7 px-2"> 
              <XCircle className="mr-1 h-3 w-3" /> Reset Filters 
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 items-end pb-4 px-4"> <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9 text-xs" 
            prependIcon={<Search className="h-4 w-4 text-muted-foreground" />} 
          />
          <MultiSelectFilter title="Status" options={ALL_STATUSES} selectedValues={selectedStatuses} onValueChange={(status) => handleFilterToggle(selectedStatuses, status as ProjectStatus, setSelectedStatuses)} />
          <MultiSelectFilter title="Priority" options={ALL_PRIORITIES} selectedValues={selectedPriorities} onValueChange={(priority) => handleFilterToggle(selectedPriorities, priority as Project['priority'], setSelectedPriorities)} />
          <MultiSelectFilter title="Team Lead" options={uniqueTeamLeads} selectedValues={selectedTeamLeads} onValueChange={(lead) => handleFilterToggle(selectedTeamLeads, lead, setSelectedTeamLeads)} />
          <MultiSelectFilter title="Portfolio" options={uniquePortfolios} selectedValues={selectedPortfolios} onValueChange={(portfolio) => handleFilterToggle(selectedPortfolios, portfolio, setSelectedPortfolios)} />
          <DateRangePicker date={dateRange} onDateChange={setDateRange} buttonClassName="h-9 text-xs w-full" /> 
        </CardContent>
      </Card>


      <Tabs defaultValue="performance" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
          <TabsTrigger value="performance" className="text-xs py-2"> 
            <ListChecks className="mr-1.5 h-3.5 w-3.5" /> Performance ({filteredProjects.length}) 
          </TabsTrigger>
          <TabsTrigger value="portfolio" className="text-xs py-2">
            <Briefcase className="mr-1.5 h-3.5 w-3.5" /> Portfolios ({portfolioSummaries.length})
          </TabsTrigger>
          <TabsTrigger value="resources" className="text-xs py-2">
            <UsersRound className="mr-1.5 h-3.5 w-3.5" /> Team ({teamLeadWorkloads.length})
          </TabsTrigger>
          <TabsTrigger value="trends" className="text-xs py-2">
            <Brain className="mr-1.5 h-3.5 w-3.5" /> Trends &amp; AI Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="mt-4"> 
          <Card className="shadow-lg">
            <CardHeader className="pb-3 pt-4 px-4"> 
                <CardTitle className="text-lg">Project Performance Details</CardTitle> 
                <CardDescription className="text-xs">Comprehensive overview of filtered projects, their status, and key metrics.</CardDescription> 
            </CardHeader>
            <CardContent className="pt-2 px-2 pb-2"> <ScrollArea className="h-[500px] w-full">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                    <TableRow>
                      <TableHead className="w-[180px] py-2.5 px-3 text-xs whitespace-nowrap">Project Name</TableHead> 
                      <TableHead className="py-2.5 px-3 text-xs">Status</TableHead>
                      <TableHead className="py-2.5 px-3 text-xs">Priority</TableHead>
                      <TableHead className="text-right py-2.5 px-3 text-xs whitespace-nowrap">Completion %</TableHead>
                      <TableHead className="text-right py-2.5 px-3 text-xs">Budget</TableHead>
                      <TableHead className="text-right py-2.5 px-3 text-xs">Spent</TableHead>
                      <TableHead className="text-right py-2.5 px-3 text-xs">Variance</TableHead>
                      <TableHead className="py-2.5 px-3 text-xs whitespace-nowrap">Start Date</TableHead>
                      <TableHead className="py-2.5 px-3 text-xs whitespace-nowrap">End Date</TableHead>
                      <TableHead className="py-2.5 px-3 text-xs whitespace-nowrap">Timeline</TableHead>
                      <TableHead className="py-2.5 px-3 text-xs whitespace-nowrap">Team Lead</TableHead>
                      <TableHead className="py-2.5 px-3 text-xs">Portfolio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProjects.length === 0 && (
                        <TableRow><TableCell colSpan={12} className="h-20 text-center text-muted-foreground text-xs">No projects match the current filters.</TableCell></TableRow> 
                    )}
                    {filteredProjects.map(project => {
                      const metrics = projectMetrics[project.id];
                      const currentStatusStyles = statusStyles[project.status] || statusStyles['Planning'];
                      const StatusIconElement = statusIcons[project.status];
                      let daysRemainingDisplay: React.ReactNode = <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground"/>;
                      if (!isLoadingMetrics && metrics) {
                        if (project.status === 'Completed') {
                          daysRemainingDisplay = <span className="text-green-600 dark:text-green-400 font-medium text-xs">Completed</span>;
                        } else if (metrics.isOverdue) {
                          daysRemainingDisplay = <span className="text-red-600 dark:text-red-400 font-medium text-xs">{Math.abs(metrics.daysRemaining)} days overdue</span>;
                        } else {
                          daysRemainingDisplay = <span className="text-muted-foreground text-xs">{metrics.daysRemaining} days left</span>;
                        }
                      } else if (!isLoadingMetrics) {
                        daysRemainingDisplay = <span className="text-muted-foreground text-xs">N/A</span>;
                      }

                      return (
                        <TableRow key={project.id} className="hover:bg-muted/30 text-xs"> 
                          <TableCell className="font-medium text-primary py-2 px-3 whitespace-nowrap">{project.name}</TableCell> 
                          <TableCell className="py-2 px-3">
                            <Badge className={cn('text-xs px-2 py-0.5', currentStatusStyles.badge)} variant="outline">
                              {StatusIconElement && <StatusIconElement className="mr-1 h-3 w-3" />}
                              {project.status}
                            </Badge>
                          </TableCell>
                           <TableCell className="py-2 px-3">
                            <Badge variant="outline" className={cn("text-xs px-1.5 py-0.5", priorityColors[project.priority])}>
                              {project.priority}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right py-2 px-3">
                            <div className="flex items-center justify-end">
                                <span className="mr-1.5 text-xs">{project.completionPercentage}%</span>
                                <Progress value={project.completionPercentage} className="h-1.5 w-12 sm:w-16" indicatorClassName={currentStatusStyles.progress} aria-label={`${project.completionPercentage}% complete`} /> 
                            </div>
                          </TableCell>
                          <TableCell className="text-right py-2 px-3">{formatCurrency(project.budget)}</TableCell>
                          <TableCell className="text-right py-2 px-3">{formatCurrency(project.spent)}</TableCell>
                          <TableCell className={cn("text-right py-2 px-3 font-medium", project.budget - project.spent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
                            {formatCurrency(project.budget - project.spent)}
                          </TableCell>
                          <TableCell className="py-2 px-3 text-muted-foreground whitespace-nowrap">{formatDate(project.startDate)}</TableCell>
                          <TableCell className="py-2 px-3 text-muted-foreground whitespace-nowrap">{formatDate(project.endDate)}</TableCell>
                          <TableCell className="py-2 px-3 whitespace-nowrap">
                            {daysRemainingDisplay}
                          </TableCell>
                          <TableCell className="py-2 px-3 text-muted-foreground whitespace-nowrap">{project.teamLead}</TableCell>
                          <TableCell className="py-2 px-3 text-muted-foreground">{project.portfolio}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="portfolio" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"> {portfolioSummaries.map(summary => (
              <Card key={summary.portfolioName} className="shadow-lg flex flex-col">
                <CardHeader className="pb-2 pt-4 px-4"> <CardTitle className="text-md text-primary">{summary.portfolioName}</CardTitle> <CardDescription className="text-xs">{summary.totalProjects} project{summary.totalProjects !== 1 ? 's' : ''}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2.5 flex-grow pt-2 px-4 pb-3 text-xs"> <div>
                    <p className="font-medium text-muted-foreground mb-0.5">Avg. Completion</p>
                    <div className="flex items-center">
                      <Progress value={summary.averageCompletion} className="h-2 mr-2 flex-1" indicatorClassName={statusStyles['On Track'].progress} aria-label={`Average completion ${summary.averageCompletion}%`} /> 
                      <span className="font-semibold text-foreground">{summary.averageCompletion}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground mb-0.5">Financials</p>
                    <p className="text-xs text-muted-foreground/80">Budget: {formatCurrency(summary.totalBudget)}</p>
                    <p className="text-xs text-muted-foreground/80">Spent: {formatCurrency(summary.totalSpent)}</p>
                    <p className={cn("text-xs font-semibold", summary.budgetVariance >=0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
                      Variance: {formatCurrency(summary.budgetVariance)}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground mb-1">Status Breakdown</p>
                    <div className="space-y-1"> {Object.entries(summary.statusCounts).map(([status, count]) =>
                      count > 0 ? (
                        <div key={status} className="flex justify-between items-center text-xs">
                           <Badge className={cn('text-xs py-0.5 px-1.5 font-normal', (statusStyles[status as ProjectStatus] || statusStyles['Planning']).badge)} variant="outline">
                             {statusIcons[status as ProjectStatus] && React.createElement(statusIcons[status as ProjectStatus], {className: "h-2.5 w-2.5 mr-1"})} 
                             {status}
                           </Badge>
                          <span className="text-muted-foreground">{count} project{count > 1 ? 's' : ''}</span>
                        </div>
                      ) : null
                    )}
                    </div>
                  </div>
                   <Button
                    variant="link"
                    size="sm"
                    className="text-xs h-auto p-0 mt-1.5 text-primary hover:text-primary/80"  onClick={() => {setSelectedPortfolioForModal(summary); setIsPortfolioModalOpen(true);}}
                  >
                    View Projects in Portfolio
                  </Button>
                </CardContent>
              </Card>
            ))}
             {portfolioSummaries.length === 0 && (
                <Card className="md:col-span-2 lg:col-span-3 shadow-lg">
                    <CardContent className="text-center py-12"> <Briefcase className="mx-auto h-10 w-10 text-muted-foreground mb-3" />  No portfolio data available for current filters.</CardContent>
                </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="resources" className="mt-4">
          <Card className="shadow-lg">
            <CardHeader className="pb-3 pt-4 px-4">
                <CardTitle className="text-lg">Team Overview &amp; Workload</CardTitle>
                <CardDescription className="text-xs">Breakdown of projects managed by each team lead, based on current filters.</CardDescription>
            </CardHeader>
            <CardContent className="pt-2 px-2 pb-2">
              <ScrollArea className="h-[500px] w-full">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                    <TableRow>
                      <TableHead className="w-[150px] py-2.5 px-3 text-xs whitespace-nowrap">Team Lead</TableHead>
                      <TableHead className="text-center py-2.5 px-3 text-xs whitespace-nowrap">Total Projects</TableHead>
                      <TableHead className="text-center py-2.5 px-3 text-xs whitespace-nowrap">Active</TableHead>
                      <TableHead className="text-center py-2.5 px-3 text-xs whitespace-nowrap">Completed</TableHead>
                      <TableHead className="text-right py-2.5 px-3 text-xs whitespace-nowrap">Avg. Active Comp. %</TableHead>
                      <TableHead className="text-right py-2.5 px-3 text-xs whitespace-nowrap">Total Budget ($)</TableHead>
                      <TableHead className="py-2.5 px-3 text-xs">Active Project Statuses</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamLeadWorkloads.length === 0 && (
                        <TableRow><TableCell colSpan={7} className="h-20 text-center text-muted-foreground text-xs">No team lead data for current filters.</TableCell></TableRow>
                    )}
                    {teamLeadWorkloads.map(lead => (
                      <TableRow key={lead.teamLead} className="hover:bg-muted/30 text-xs">
                        <TableCell className="font-medium py-2 px-3 whitespace-nowrap">{lead.teamLead}</TableCell>
                        <TableCell className="text-center py-2 px-3">{lead.projectCount}</TableCell>
                        <TableCell className="text-center py-2 px-3">{lead.activeProjectsCount}</TableCell>
                        <TableCell className="text-center py-2 px-3">{lead.completedProjectsCount}</TableCell>
                        <TableCell className="text-right py-2 px-3">
                            <div className="flex items-center justify-end">
                                <span className="mr-1.5 text-xs">{lead.averageCompletionPercentage.toFixed(1)}%</span>
                                <Progress value={lead.averageCompletionPercentage} className="h-1.5 w-12 sm:w-16" indicatorClassName={statusStyles['On Track'].progress} aria-label={`Average active completion ${lead.averageCompletionPercentage}%`} />
                            </div>
                        </TableCell>
                        <TableCell className="text-right py-2 px-3">{formatCurrency(lead.totalBudgetManaged)}</TableCell>
                        <TableCell className="py-2 px-3">
                          <div className="flex flex-wrap gap-1"> {Object.entries(lead.statusDistribution)
                              .filter(([status, count]) => status !== 'Completed' && count > 0)
                              .map(([status, count]) => {
                                const StatusIconElement = statusIcons[status as ProjectStatus];
                                const currentStatusStyles = statusStyles[status as ProjectStatus] || statusStyles['Planning'];
                                return (
                                  <TooltipProvider key={status} delayDuration={100}>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Badge className={cn('text-xs px-1.5 py-0.5', currentStatusStyles.badge)} variant="outline"> {StatusIconElement && React.createElement(StatusIconElement, {className: "h-2.5 w-2.5 mr-0.5"})} 
                                          {count}
                                        </Badge>
                                      </TooltipTrigger>
                                      <TooltipContent className="text-xs p-1 bg-popover shadow-sm rounded-sm border">
                                        {count} {status} project{count > 1 ? 's' : ''}
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                );
                            })}
                            {lead.activeProjectsCount === 0 && <span className="text-xs text-muted-foreground italic">No active projects</span>}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="mt-4">
            <Card className="shadow-lg">
                <CardHeader className="pb-3 pt-4 px-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg flex items-center">
                                <Brain className="mr-2 h-5 w-5 text-primary" /> Trends &amp; AI Predictions
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Identify patterns and predict future performance with AI analysis.
                                Results are based on the currently filtered project data.
                            </CardDescription>
                        </div>
                        <Button onClick={fetchTrendsAndPredictions} disabled={isLoadingTrendsAndPredictions || filteredProjects.length === 0} size="sm" className="h-9 px-3 text-xs">
                            {isLoadingTrendsAndPredictions ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Brain className="mr-1.5 h-3.5 w-3.5" />}
                            {isLoadingTrendsAndPredictions ? 'Analyzing...' : 'Re-analyze with AI'}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="pt-2 px-4 pb-4 space-y-5"> {filteredProjects.length === 0 && (
                         <Alert variant="default" className="border-yellow-400 text-yellow-700 dark:border-yellow-500 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 p-3"> 
                            <HelpCircle className="h-4 w-4 !text-yellow-600 dark:!text-yellow-400" />
                            <ShadcnAlertTitle className="font-semibold text-sm">No Data for Analysis</ShadcnAlertTitle>
                            <AlertDescription className="text-xs">
                                There are no projects matching the current filters. Please adjust your filters to enable trend analysis and AI predictions.
                            </AlertDescription>
                        </Alert>
                    )}
                    {filteredProjects.length > 0 && (
                        <>
                        <Card>
                            <CardHeader className="pb-2 pt-3 px-3">
                                <CardTitle className="text-md flex items-center"> 
                                    <LineChartIcon className="mr-2 h-4 w-4 text-accent" /> Calculated Trend Indicators
                                </CardTitle>
                                <CardDescription className="text-xs">Basic trends based on comparing older vs. newer projects in the current filtered dataset.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 px-3 pb-3"> {calculatedTrendIndicators.length === 0 && !isLoadingTrendsAndPredictions && <p className="text-xs text-muted-foreground col-span-full text-center py-3">Not enough distinct project start dates in the filtered set to calculate trends. Try broader filters.</p>}
                                {calculatedTrendIndicators.map((indicator, idx) => (
                                    <Card key={idx} className="bg-secondary/40 shadow-sm">
                                        <CardHeader className="p-3 pb-1.5">  <CardTitle className="text-sm">{indicator.metricName}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-3 pt-0 text-xs">
                                            <p>Current: <span className="font-semibold">{indicator.currentValue}</span></p>
                                            <p className={cn(
                                                indicator.trend === 'Improving' && "text-green-600 dark:text-green-400",
                                                indicator.trend === 'Declining' && "text-red-600 dark:text-red-400",
                                                indicator.trend === 'Stable' && "text-muted-foreground"
                                            )}>
                                                Trend: {indicator.trendDescription}
                                                {indicator.trend === 'Improving' && <TrendingUp className="inline ml-1 h-3.5 w-3.5" />}
                                                {indicator.trend === 'Declining' && <TrendingDown className="inline ml-1 h-3.5 w-3.5" />}
                                            </p>
                                            {indicator.historicalComparison && <p className="text-xs text-muted-foreground">({indicator.historicalComparison})</p>}
                                        </CardContent>
                                    </Card>
                                ))}
                            </CardContent>
                        </Card>
                    
                        <Card>
                            <CardHeader className="pb-2 pt-3 px-3">
                                <CardTitle className="text-md flex items-center">
                                    <Brain className="mr-2 h-4 w-4 text-accent" /> AI-Powered Predictions
                                </CardTitle>
                                 <CardDescription className="text-xs">Insights generated by AI based on the current filtered data. Confidence: High, Medium, Low.</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-2 px-3 pb-3">
                                {isLoadingTrendsAndPredictions && (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin text-primary mr-2.5" />
                                        <p className="text-muted-foreground text-sm">AI is analyzing data and generating predictions...</p>
                                    </div>
                                )}
                                {trendsError && !isLoadingTrendsAndPredictions && (
                                    <Alert variant="destructive" className="p-3">
                                        <AlertTriangle className="h-4 w-4" />
                                        <ShadcnAlertTitle className="text-sm font-semibold">Error Generating Predictions</ShadcnAlertTitle>
                                        <AlertDescription className="text-xs">{trendsError}</AlertDescription>
                                    </Alert>
                                )}
                                {!isLoadingTrendsAndPredictions && !trendsError && trendsAndPredictions && trendsAndPredictions.predictions.length > 0 && (
                                    <div className="space-y-3"> {trendsAndPredictions.predictions.map((pred, idx) => (
                                            <Alert key={idx} variant={'default'} 
                                                className={cn(
                                                    "border-l-4 p-3",
                                                    pred.confidence === 'High' && "border-green-500 bg-green-50 dark:bg-green-900/20",
                                                    pred.confidence === 'Medium' && "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20",
                                                    pred.confidence === 'Low' && "border-gray-400 bg-gray-50 dark:bg-gray-700/20"
                                                )}
                                            >
                                                <div className={cn("flex items-center font-semibold mb-0.5 text-xs", 
                                                    pred.confidence === 'High' && "text-green-700 dark:text-green-300",
                                                    pred.confidence === 'Medium' && "text-yellow-700 dark:text-yellow-400",
                                                    pred.confidence === 'Low' && "text-gray-600 dark:text-gray-300"
                                                )}>
                                                    {pred.confidence === 'High' && <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />}
                                                    {pred.confidence === 'Medium' && <TrendingUp className="h-3.5 w-3.5 mr-1.5" />}
                                                    {pred.confidence === 'Low' && <HelpCircle className="h-3.5 w-3.5 mr-1.5" />}
                                                    {pred.area}: <span className="ml-1 font-normal text-foreground">{pred.prediction}</span>
                                                </div>
                                                {pred.suggestion && <AlertDescription className="text-xs text-muted-foreground pl-5">{pred.suggestion}</AlertDescription>} 
                                            </Alert>
                                        ))}
                                    </div >
                                )}
                                {!isLoadingTrendsAndPredictions && !trendsError && (!trendsAndPredictions || trendsAndPredictions.predictions.length === 0) && (
                                    <p className="text-xs text-muted-foreground text-center py-4">No specific AI predictions generated for the current data. The AI might need more distinct data or clearer trends.</p>
                                )}
                            </CardContent>
                        </Card>
                        </>
                    )}
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>

       <Dialog open={isPortfolioModalOpen} onOpenChange={setIsPortfolioModalOpen}>
        <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[80vh]">
          <DialogHeader className="px-4 pt-4 pb-3">
            <DialogTitle className="text-xl">Projects in: {selectedPortfolioForModal?.portfolioName}</DialogTitle>
            <DialogDescription className="text-xs">
              Detailed list of projects within this portfolio, reflecting current global filters.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[60vh] px-4">
            {selectedPortfolioForModal && selectedPortfolioForModal.projects.length > 0 ? (
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                  <TableRow>
                    <TableHead className="py-2 px-2.5 text-xs">Project Name</TableHead>
                    <TableHead className="py-2 px-2.5 text-xs">Status</TableHead>
                    <TableHead className="py-2 px-2.5 text-xs">Priority</TableHead>
                    <TableHead className="text-right py-2 px-2.5 text-xs">Comp. %</TableHead>
                    <TableHead className="text-right py-2 px-2.5 text-xs">Budget</TableHead>
                    <TableHead className="text-right py-2 px-2.5 text-xs">Spent</TableHead>
                    <TableHead className="py-2 px-2.5 text-xs">Team Lead</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedPortfolioForModal.projects.map(project => {
                     const currentStatusStyles = statusStyles[project.status] || statusStyles['Planning'];
                     const StatusIconElement = statusIcons[project.status];
                     return (
                        <TableRow key={project.id} className="hover:bg-muted/30 text-xs">
                          <TableCell className="font-medium text-primary py-1.5 px-2.5">{project.name}</TableCell>
                          <TableCell className="py-1.5 px-2.5">
                             <Badge className={cn('text-xs px-1.5 py-0.5', currentStatusStyles.badge)} variant="outline">
                               {StatusIconElement && <StatusIconElement className="mr-1 h-2.5 w-2.5" />}
                               {project.status}
                             </Badge>
                          </TableCell>
                          <TableCell className="py-1.5 px-2.5">
                            <Badge variant="outline" className={cn("text-xs px-1 py-0", priorityColors[project.priority])}>
                              {project.priority}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right py-1.5 px-2.5">{project.completionPercentage}%</TableCell>
                          <TableCell className="text-right text-xs py-1.5 px-2.5">
                          {formatCurrency(project.budget)}</TableCell>
                          <TableCell className="text-right text-xs py-1.5 px-2.5">{formatCurrency(project.spent)}</TableCell>
                          <TableCell className="text-xs py-1.5 px-2.5">{project.teamLead}</TableCell>
                        </TableRow>
                     );
                    })}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-8 text-sm">No projects to display for this portfolio with current filters.</p> 
            )}
          </ScrollArea>
           <DialogFooter className="px-4 pt-3 pb-4">
             <Button variant="outline" size="sm" onClick={() => setIsPortfolioModalOpen(false)} className="h-9 text-xs">Close</Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
