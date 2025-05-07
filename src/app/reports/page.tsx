
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, parseISO, differenceInDays, isValid, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DateRangePicker } from '@/components/date-range-picker';
import { ListChecks, Briefcase, Users, TrendingUp, PieChart, UsersRound, AlertTriangle, Clock, CheckCircle2, Activity, Loader2, FileText, Download, Mail, FileType, Search, Filter as FilterIcon, Check, XCircle, ChevronsUpDown } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from "@/hooks/use-toast";


const statusColors: Record<ProjectStatus, string> = {
  'On Track': 'bg-green-500 text-white',
  'At Risk': 'bg-red-500 text-white',
  'Delayed': 'bg-yellow-500 text-black',
  'Completed': 'bg-blue-500 text-white',
  'Planning': 'bg-gray-500 text-white',
};

const priorityColors: Record<Project['priority'], string> = {
  High: 'border-red-600 text-red-700 dark:text-red-500 bg-red-50 dark:bg-red-900/30',
  Medium: 'border-yellow-600 text-yellow-700 dark:text-yellow-500 bg-yellow-50 dark:bg-yellow-900/30',
  Low: 'border-green-600 text-green-700 dark:text-green-500 bg-green-50 dark:bg-green-900/30',
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

const ALL_STATUSES = Object.keys(statusIcons) as ProjectStatus[];
const ALL_PRIORITIES = ['High', 'Medium', 'Low'] as Project['priority'][];


export default function ReportsPage() {
  const [projectMetrics, setProjectMetrics] = useState<Record<string, CalculatedProjectMetrics | null>>({});
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('performance');
  const { toast } = useToast();

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<Set<ProjectStatus>>(new Set());
  const [selectedPriorities, setSelectedPriorities] = useState<Set<Project['priority']>>(new Set());
  const [selectedTeamLeads, setSelectedTeamLeads] = useState<Set<string>>(new Set());
  const [selectedPortfolios, setSelectedPortfolios] = useState<Set<string>>(new Set());
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);
  const [selectedPortfolioForModal, setSelectedPortfolioForModal] = useState<PortfolioSummary | null>(null);


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
  
  const handleFilterToggle = <T,>(set: Set<T>, item: T, setter: React.Dispatch<React.SetStateAction<Set<T>>>) => {
    const newSet = new Set(set);
    if (newSet.has(item)) {
      newSet.delete(item);
    } else {
      newSet.add(item);
    }
    setter(newSet);
  };
  
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
        } else if (metrics.daysRemaining < 0) {
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
    let html = `<html><head><style>
      body { font-family: Helvetica, Arial, sans-serif; font-size: 10pt; color: #333; margin: 20px; }
      table { border-collapse: collapse; width: 100%; margin-bottom: 20px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
      th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; vertical-align: top; }
      th { background-color: #f8fafc; color: #4a5568; font-weight: 600; text-transform: uppercase; font-size: 0.85em;}
      tr:nth-child(even) { background-color: #f7fafc; }
      tr:hover { background-color: #edf2f7; }
      .currency { text-align: right; } .percentage { text-align: right; }
      .status-on-track { color: #38a169; } .status-at-risk { color: #e53e3e; } .status-delayed { color: #dd6b20; }
      .status-completed { color: #3182ce; } .status-planning { color: #718096; }
      .priority-high { color: #c53030; } .priority-medium { color: #d69e2e; } .priority-low { color: #2f855a; }
      .variance-positive { color: #38a169; } .variance-negative { color: #e53e3e; }
      h1 { font-size: 1.8em; color: #2d3748; margin-bottom: 0.5em; }
      h2 { font-size: 1.4em; color: #4a5568; margin-bottom: 0.5em; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.3em; }
      .card { border: 1px solid #e2e8f0; border-radius: 0.375rem; padding: 1.5rem; margin-bottom: 1.5rem; background-color: #fff; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06); display: inline-block; width: calc(33% - 1.5rem); vertical-align: top; margin-right: 1rem;}
      .card-title { font-size: 1.25rem; font-weight: 600; margin-bottom: 0.25rem; color: #2d3748; }
      .card-description { font-size: 0.875rem; color: #718096; margin-bottom: 1rem; }
      .flex-container { display: flex; flex-wrap: wrap; gap: 1.5rem; }
      .progress-bar { background-color: #e2e8f0; border-radius: 0.25rem; height: 0.5rem; overflow: hidden; margin-top: 0.25rem; }
      .progress-bar-inner { background-color: #4299e1; height: 100%; }
      .filter-info { margin-bottom: 20px; padding: 10px; background-color: #f9f9f9; border: 1px solid #eee; border-radius: 4px; font-size: 0.9em;}
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
        <thead><tr><th>Project Name</th><th>Status</th><th>Priority</th><th>Completion %</th><th>Budget</th><th>Spent</th><th>Variance</th><th>Start Date</th><th>End Date</th><th>Days Left/Overdue</th><th>Team Lead</th><th>Portfolio</th></tr></thead>
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
      html += `</div>`;
    } else if (tab === 'resources') {
      html += `<h2>Team Overview & Workload</h2><table>
        <thead><tr><th>Team Lead</th><th>Project Count (Filtered)</th><th>Active</th><th>Completed</th><th>Avg. Active Completion %</th><th>Total Budget Managed</th><th>Status Distribution (Active)</th></tr></thead>
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
      html += `</tbody></table>`;
    }
    html += `</body></html>`;
    return html;
  };

  const handleShareViaEmail = () => {
    const reportHtml = generateReportHTML(activeTab);
    const subject = `ProjectPulse Report: ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} (Filtered)`;
    const body = `
Please find the ${activeTab} report below. This report reflects the currently applied filters.

${reportHtml}
    `;
    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    if (mailtoLink.length > 2000) {
      toast({
        title: "Email Content Too Long",
        description: "The generated HTML report is too large to be sent directly via email. Please try downloading as CSV or PDF.",
        variant: "destructive",
        duration: 7000,
      });
    } else {
       window.location.href = mailtoLink;
    }
  };

  const handleDownloadPDF = () => {
    toast({
      title: "PDF Download (Simulated)",
      description: "Actual PDF generation would require a client or server-side library. This is a placeholder.",
      variant: "default",
      duration: 5000,
    });
  };

  const MultiSelectFilter = ({ title, options, selectedValues, onValueChange }: { title: string, options: readonly string[], selectedValues: Set<string>, onValueChange: (item: string) => void }) => {
    const [open, setOpen] = React.useState(false);
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} className="w-full sm:w-[200px] justify-between h-10 text-sm">
            <div className="flex items-center">
              <FilterIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              {title}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput placeholder={`Search ${title.toLowerCase()}...`} />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option}
                    onSelect={() => {
                      onValueChange(option);
                    }}
                    className="text-sm"
                  >
                    <Check className={cn("mr-2 h-4 w-4", selectedValues.has(option) ? "opacity-100" : "opacity-0")} />
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
                      className="justify-center text-center text-xs text-muted-foreground"
                    >
                      Clear selection
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
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center">
          <FileText className="h-8 w-8 mr-3 text-primary shrink-0" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Project Reports</h1>
            <p className="text-sm text-muted-foreground">Analyze project data with advanced filters and export options.</p>
          </div>
        </div>
         <div className="flex gap-2 flex-wrap sm:flex-nowrap">
            <Button onClick={() => {
                if (activeTab === 'performance') handleDownloadPerformanceCSV();
                else if (activeTab === 'portfolio') handleDownloadPortfolioSummariesCSV();
                else if (activeTab === 'resources') handleDownloadTeamOverviewCSV();
                else toast({ title: "CSV Export", description: `CSV export is not available for this tab.`, variant: "default" });
            }} size="sm" variant="outline" title="Download current view as CSV">
                <Download className="mr-2 h-4 w-4" /> CSV
            </Button>
            <Button onClick={handleDownloadPDF} size="sm" variant="outline" title="Download current view as PDF (Simulated)">
                <FileType className="mr-2 h-4 w-4" /> PDF
            </Button>
            <Button onClick={handleShareViaEmail} size="sm" variant="outline" title="Share current view via Email">
                <Mail className="mr-2 h-4 w-4" /> Share
            </Button>
        </div>
      </div>
      
      <Card className="mb-8 shadow-md">
        <CardHeader className="pb-3 pt-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <CardTitle className="text-lg font-semibold">Filter Options</CardTitle>
            <Button variant="ghost" size="sm" onClick={resetFilters} className="text-xs text-muted-foreground hover:text-primary">
              <XCircle className="mr-1.5 h-3.5 w-3.5" /> Reset Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-end pb-4">
          <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 text-sm"
            prependIcon={<Search className="h-4 w-4 text-muted-foreground" />}
          />
          <MultiSelectFilter title="Status" options={ALL_STATUSES} selectedValues={selectedStatuses} onValueChange={(status) => handleFilterToggle(selectedStatuses, status as ProjectStatus, setSelectedStatuses)} />
          <MultiSelectFilter title="Priority" options={ALL_PRIORITIES} selectedValues={selectedPriorities} onValueChange={(priority) => handleFilterToggle(selectedPriorities, priority as Project['priority'], setSelectedPriorities)} />
          <MultiSelectFilter title="Team Lead" options={uniqueTeamLeads} selectedValues={selectedTeamLeads} onValueChange={(lead) => handleFilterToggle(selectedTeamLeads, lead, setSelectedTeamLeads)} />
          <MultiSelectFilter title="Portfolio" options={uniquePortfolios} selectedValues={selectedPortfolios} onValueChange={(portfolio) => handleFilterToggle(selectedPortfolios, portfolio, setSelectedPortfolios)} />
          <DateRangePicker date={dateRange} onDateChange={setDateRange} buttonClassName="h-10 text-sm w-full sm:w-auto" />
        </CardContent>
      </Card>


      <Tabs defaultValue="performance" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 gap-2 mb-6">
          <TabsTrigger value="performance" className="text-sm py-2.5">
            <ListChecks className="mr-2 h-4 w-4" /> Project Performance ({filteredProjects.length})
          </TabsTrigger>
          <TabsTrigger value="portfolio" className="text-sm py-2.5">
            <Briefcase className="mr-2 h-4 w-4" /> Portfolio Summaries ({portfolioSummaries.length})
          </TabsTrigger>
          <TabsTrigger value="resources" className="text-sm py-2.5">
            <UsersRound className="mr-2 h-4 w-4" /> Team Overview ({teamLeadWorkloads.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="mt-6">
          <Card className="shadow-lg">
            <CardHeader className="pb-4">
                <CardTitle className="text-2xl">Project Performance Details</CardTitle>
                <CardDescription>Comprehensive overview of filtered projects, their status, and key metrics.</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <ScrollArea className="h-[600px] w-full">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                    <TableRow>
                      <TableHead className="w-[200px] py-3 whitespace-nowrap">Project Name</TableHead>
                      <TableHead className="py-3">Status</TableHead>
                      <TableHead className="py-3">Priority</TableHead>
                      <TableHead className="text-right py-3 whitespace-nowrap">Completion %</TableHead>
                      <TableHead className="text-right py-3">Budget</TableHead>
                      <TableHead className="text-right py-3">Spent</TableHead>
                      <TableHead className="text-right py-3">Variance</TableHead>
                      <TableHead className="py-3 whitespace-nowrap">Start Date</TableHead>
                      <TableHead className="py-3 whitespace-nowrap">End Date</TableHead>
                      <TableHead className="py-3 whitespace-nowrap">Timeline</TableHead>
                      <TableHead className="py-3 whitespace-nowrap">Team Lead</TableHead>
                      <TableHead className="py-3">Portfolio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProjects.length === 0 && (
                        <TableRow><TableCell colSpan={12} className="h-24 text-center text-muted-foreground">No projects match the current filters.</TableCell></TableRow>
                    )}
                    {filteredProjects.map(project => {
                      const metrics = projectMetrics[project.id];
                      const StatusIconElement = statusIcons[project.status];
                      let daysRemainingDisplay: React.ReactNode = <Loader2 className="h-4 w-4 animate-spin text-muted-foreground"/>;
                      if (!isLoadingMetrics && metrics) {
                        if (project.status === 'Completed') {
                          daysRemainingDisplay = <span className="text-green-600 dark:text-green-400 font-medium">Completed</span>;
                        } else if (metrics.isOverdue) {
                          daysRemainingDisplay = <span className="text-red-600 dark:text-red-400 font-medium">{Math.abs(metrics.daysRemaining)} days overdue</span>;
                        } else {
                          daysRemainingDisplay = <span className="text-muted-foreground">{metrics.daysRemaining} days left</span>;
                        }
                      } else if (!isLoadingMetrics) {
                        daysRemainingDisplay = <span className="text-muted-foreground">N/A</span>;
                      }

                      return (
                        <TableRow key={project.id} className="hover:bg-muted/30">
                          <TableCell className="font-medium text-primary py-3 whitespace-nowrap">{project.name}</TableCell>
                          <TableCell className="py-3">
                            <Badge className={cn('text-xs px-2.5 py-1', statusColors[project.status])}>
                              {StatusIconElement && <StatusIconElement className="mr-1.5 h-3 w-3" />}
                              {project.status}
                            </Badge>
                          </TableCell>
                           <TableCell className="py-3">
                            <Badge variant="outline" className={cn("text-xs px-2 py-0.5", priorityColors[project.priority])}>
                              {project.priority}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right py-3">
                            <div className="flex items-center justify-end">
                                <span className="mr-2 text-sm">{project.completionPercentage}%</span>
                                <Progress value={project.completionPercentage} className="h-2 w-16 sm:w-20" aria-label={`${project.completionPercentage}% complete`} />
                            </div>
                          </TableCell>
                          <TableCell className="text-right py-3">{formatCurrency(project.budget)}</TableCell>
                          <TableCell className="text-right py-3">{formatCurrency(project.spent)}</TableCell>
                          <TableCell className={cn("text-right py-3 font-medium", project.budget - project.spent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
                            {formatCurrency(project.budget - project.spent)}
                          </TableCell>
                          <TableCell className="py-3 text-muted-foreground whitespace-nowrap">{formatDate(project.startDate)}</TableCell>
                          <TableCell className="py-3 text-muted-foreground whitespace-nowrap">{formatDate(project.endDate)}</TableCell>
                          <TableCell className="py-3 whitespace-nowrap">
                            {daysRemainingDisplay}
                          </TableCell>
                          <TableCell className="py-3 text-muted-foreground whitespace-nowrap">{project.teamLead}</TableCell>
                          <TableCell className="py-3 text-muted-foreground">{project.portfolio}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="portfolio" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolioSummaries.map(summary => (
              <Card key={summary.portfolioName} className="shadow-lg flex flex-col">
                <CardHeader className="pb-3 pt-5">
                  <CardTitle className="text-xl text-primary">{summary.portfolioName}</CardTitle>
                  <CardDescription>{summary.totalProjects} project{summary.totalProjects !== 1 ? 's' : ''}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 flex-grow pt-2 text-sm">
                  <div>
                    <p className="font-medium text-muted-foreground mb-1">Avg. Completion</p>
                    <div className="flex items-center">
                      <Progress value={summary.averageCompletion} className="h-2.5 mr-2 flex-1" aria-label={`Average completion ${summary.averageCompletion}%`} />
                      <span className="font-semibold text-foreground">{summary.averageCompletion}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground mb-1">Financials</p>
                    <p className="text-xs text-muted-foreground/80">Budget: {formatCurrency(summary.totalBudget)}</p>
                    <p className="text-xs text-muted-foreground/80">Spent: {formatCurrency(summary.totalSpent)}</p>
                    <p className={cn("text-xs font-semibold", summary.budgetVariance >=0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
                      Variance: {formatCurrency(summary.budgetVariance)}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground mb-1.5">Status Breakdown</p>
                    <div className="space-y-1.5">
                    {Object.entries(summary.statusCounts).map(([status, count]) =>
                      count > 0 ? (
                        <div key={status} className="flex justify-between items-center text-xs">
                           <Badge className={cn('text-xs py-0.5 px-2 font-normal', statusColors[status as ProjectStatus])} variant="default">
                             {statusIcons[status as ProjectStatus] && React.createElement(statusIcons[status as ProjectStatus], {className: "h-3 w-3 mr-1"})}
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
                    className="text-xs h-auto p-0 mt-2"
                    onClick={() => {setSelectedPortfolioForModal(summary); setIsPortfolioModalOpen(true);}}
                  >
                    View Projects in Portfolio
                  </Button>
                </CardContent>
              </Card>
            ))}
             {portfolioSummaries.length === 0 && (
                <Card className="md:col-span-2 lg:col-span-3 shadow-lg">
                    <CardContent className="text-center py-16">
                        <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground text-lg">No portfolio data available for current filters.</p>
                    </CardContent>
                </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="resources" className="mt-6">
          <Card className="shadow-lg">
            <CardHeader className="pb-4">
                <CardTitle className="text-2xl">Team Overview & Workload</CardTitle>
                <CardDescription>Breakdown of projects managed by each team lead, based on current filters.</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <ScrollArea className="h-[600px] w-full">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                    <TableRow>
                      <TableHead className="w-[180px] py-3 whitespace-nowrap">Team Lead</TableHead>
                      <TableHead className="text-center py-3 whitespace-nowrap">Total Projects</TableHead>
                      <TableHead className="text-center py-3 whitespace-nowrap">Active</TableHead>
                      <TableHead className="text-center py-3 whitespace-nowrap">Completed</TableHead>
                      <TableHead className="text-right py-3 whitespace-nowrap">Avg. Active Comp. %</TableHead>
                      <TableHead className="text-right py-3 whitespace-nowrap">Total Budget ($)</TableHead>
                      <TableHead className="py-3">Active Project Statuses</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamLeadWorkloads.length === 0 && (
                        <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No team lead data for current filters.</TableCell></TableRow>
                    )}
                    {teamLeadWorkloads.map(lead => (
                      <TableRow key={lead.teamLead} className="hover:bg-muted/30">
                        <TableCell className="font-medium py-3 whitespace-nowrap">{lead.teamLead}</TableCell>
                        <TableCell className="text-center py-3">{lead.projectCount}</TableCell>
                        <TableCell className="text-center py-3">{lead.activeProjectsCount}</TableCell>
                        <TableCell className="text-center py-3">{lead.completedProjectsCount}</TableCell>
                        <TableCell className="text-right py-3">
                            <div className="flex items-center justify-end">
                                <span className="mr-2 text-sm">{lead.averageCompletionPercentage.toFixed(1)}%</span>
                                <Progress value={lead.averageCompletionPercentage} className="h-2 w-16 sm:w-20" aria-label={`Average active completion ${lead.averageCompletionPercentage}%`} />
                            </div>
                        </TableCell>
                        <TableCell className="text-right py-3">{formatCurrency(lead.totalBudgetManaged)}</TableCell>
                        <TableCell className="py-3">
                          <div className="flex flex-wrap gap-1.5">
                            {Object.entries(lead.statusDistribution)
                              .filter(([status, count]) => status !== 'Completed' && count > 0)
                              .map(([status, count]) => {
                                const StatusIconElement = statusIcons[status as ProjectStatus];
                                return (
                                  <TooltipProvider key={status} delayDuration={100}>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Badge className={cn('text-xs px-2 py-0.5', statusColors[status as ProjectStatus])}>
                                          {StatusIconElement && <StatusIconElement className="h-3 w-3 mr-1" />}
                                          {count}
                                        </Badge>
                                      </TooltipTrigger>
                                      <TooltipContent className="text-xs p-1.5 bg-popover shadow-sm rounded-sm border">
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
      </Tabs>

       <Dialog open={isPortfolioModalOpen} onOpenChange={setIsPortfolioModalOpen}>
        <DialogContent className="sm:max-w-3xl md:max-w-4xl lg:max-w-5xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>Projects in: {selectedPortfolioForModal?.portfolioName}</DialogTitle>
            <DialogDescription>
              Detailed performance of projects within the &quot;{selectedPortfolioForModal?.portfolioName}&quot; portfolio, reflecting current filters.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[65vh] mt-4 pr-3">
            {selectedPortfolioForModal && selectedPortfolioForModal.projects.length > 0 ? (
              <Table>
                <TableHeader className="sticky top-0 bg-dialog-content z-10 shadow-sm">
                  <TableRow>
                    <TableHead className="w-[25%]">Project Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead className="text-right">Completion %</TableHead>
                    <TableHead className="text-right">Budget</TableHead>
                    <TableHead className="text-right">Spent</TableHead>
                    <TableHead>Team Lead</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedPortfolioForModal.projects.map(project => {
                     const StatusIconElement = statusIcons[project.status];
                     return (
                        <TableRow key={project.id} className="hover:bg-muted/20">
                          <TableCell className="font-medium text-primary py-2.5">{project.name}</TableCell>
                          <TableCell className="py-2.5">
                            <Badge className={cn('text-xs px-2 py-1', statusColors[project.status])}>
                              {StatusIconElement && <StatusIconElement className="mr-1 h-3 w-3" />}
                              {project.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-2.5">
                            <Badge variant="outline" className={cn("text-xs px-1.5 py-0.5", priorityColors[project.priority])}>
                              {project.priority}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right py-2.5">
                            <div className="flex items-center justify-end">
                                <span className="mr-1.5 text-xs">{project.completionPercentage}%</span>
                                <Progress value={project.completionPercentage} className="h-1.5 w-12 sm:w-16" aria-label={`${project.completionPercentage}% complete`} />
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-xs py-2.5">{formatCurrency(project.budget)}</TableCell>
                          <TableCell className="text-right text-xs py-2.5">{formatCurrency(project.spent)}</TableCell>
                          <TableCell className="text-xs py-2.5">{project.teamLead}</TableCell>
                        </TableRow>
                     );
                    })}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-10">No projects to display for this portfolio with current filters.</p>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

    </div>
  );
}

    