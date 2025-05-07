'use client';

import * as React from 'react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { mockProjects } from '@/lib/mock-data';
import type { Project, ProjectStatus } from '@/types/project';
import type { CalculatedProjectMetrics, PortfolioSummary, TeamLeadWorkload, TrendIndicator } from '@/types/project-reports';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, parseISO, differenceInDays, isValid, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { useToast } from "@/hooks/use-toast";
import { predictProjectPerformance, type PredictProjectPerformanceInput, type PredictProjectPerformanceOutput, type PortfolioMetricSummary } from '@/ai/flows/predict-project-performance-flow';
import { ListChecks, Briefcase, UsersRound, Brain, LineChart as LineChartIcon } from 'lucide-react';

// Import new modular components
import { ReportFilters } from '@/components/reports/report-filters';
import { ReportActions } from '@/components/reports/report-actions';
import { PortfolioDetailModal } from '@/components/reports/portfolio-detail-modal';
import { PerformanceReportTab } from '@/components/reports/performance-report-tab';
import { PortfolioReportTab } from '@/components/reports/portfolio-report-tab';
import { ResourceReportTab } from '@/components/reports/resource-report-tab';
import { TrendsReportTab } from '@/components/reports/trends-report-tab';

// Style definitions can be kept here or moved if preferred
import { statusStyles, priorityColors, statusIcons } from './report-style-definitions';

export default function ReportsPage() {
  const [projectMetrics, setProjectMetrics] = useState<Record<string, CalculatedProjectMetrics | null>>({});
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('performance');
  const { toast } = useToast();

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<Set<ProjectStatus>>(new Set());
  const [selectedPriorities, setSelectedPriorities] = useState<Set<Project['priority']>>(new Set());
  const [selectedTeamLeads, setSelectedTeamLeads] = useState<Set<string>>(new Set());
  const [selectedPortfolios, setSelectedPortfolios] = useState<Set<string>>(new Set());
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  // Modal State
  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);
  const [selectedPortfolioForModal, setSelectedPortfolioForModal] = useState<PortfolioSummary | null>(null);

  // Trends & AI State
  const [trendsAndPredictions, setTrendsAndPredictions] = useState<PredictProjectPerformanceOutput | null>(null);
  const [isLoadingTrendsAndPredictions, setIsLoadingTrendsAndPredictions] = useState(false);
  const [trendsError, setTrendsError] = useState<string | null>(null);
  const [calculatedTrendIndicators, setCalculatedTrendIndicators] = useState<TrendIndicator[]>([]);

  const uniqueTeamLeads = useMemo(() => Array.from(new Set(mockProjects.map(p => p.teamLead))).sort(), []);
  const uniquePortfolios = useMemo(() => Array.from(new Set(mockProjects.map(p => p.portfolio))).sort(), []);

  // Calculate Project Metrics Effect
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

  // Filtered Projects Memo
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

  // Portfolio Summaries Memo
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
    })).sort((a, b) => a.portfolioName.localeCompare(b.portfolioName));
  }, [filteredProjects]);

  // Team Lead Workloads Memo
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
    })).sort((a, b) => b.projectCount - a.projectCount);
  }, [filteredProjects]);

  // Calculate Trend Indicators Function
  const calculateTrendIndicators = useCallback((projects: Project[]): { completionTrend: 'Improving' | 'Declining' | 'Stable', budgetTrend: 'Improving' | 'Worsening' | 'Stable' } => {
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
  }, []); // Empty dependency array as it only depends on the `projects` input

  // Fetch Trends & Predictions Function
  const fetchTrendsAndPredictions = useCallback(async () => {
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
        .sort((a, b) => b.totalProjects - a.totalProjects)
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
  }, [filteredProjects, portfolioSummaries, calculateTrendIndicators, toast]);

  // Effect to fetch trends when tab changes
  useEffect(() => {
    if (activeTab === 'trends') {
      fetchTrendsAndPredictions();
    }
  }, [activeTab, fetchTrendsAndPredictions]);

  // Filter Handlers
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedStatuses(new Set());
    setSelectedPriorities(new Set());
    setSelectedTeamLeads(new Set());
    setSelectedPortfolios(new Set());
    setDateRange(undefined);
  };

  // Formatters
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
  };

  // CSV/HTML Generation and Download/Share Logic
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
        escapeCsvValue(project.name), escapeCsvValue(project.status), escapeCsvValue(project.priority),
        escapeCsvValue(project.completionPercentage), escapeCsvValue(project.budget), escapeCsvValue(project.spent),
        escapeCsvValue(project.budget - project.spent), escapeCsvValue(formatDate(project.startDate, true)),
        escapeCsvValue(formatDate(project.endDate, true)), escapeCsvValue(daysRemainingDisplay),
        escapeCsvValue(project.teamLead), escapeCsvValue(project.portfolio),
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
      escapeCsvValue(summary.portfolioName), escapeCsvValue(summary.totalProjects), escapeCsvValue(summary.averageCompletion),
      escapeCsvValue(summary.totalBudget), escapeCsvValue(summary.totalSpent), escapeCsvValue(summary.budgetVariance),
      escapeCsvValue(summary.statusCounts['On Track']), escapeCsvValue(summary.statusCounts['At Risk']), escapeCsvValue(summary.statusCounts['Delayed']),
      escapeCsvValue(summary.statusCounts['Completed']), escapeCsvValue(summary.statusCounts['Planning']),
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
      escapeCsvValue(lead.teamLead), escapeCsvValue(lead.projectCount), escapeCsvValue(lead.activeProjectsCount),
      escapeCsvValue(lead.completedProjectsCount), escapeCsvValue(lead.averageCompletionPercentage),
      escapeCsvValue(lead.totalBudgetManaged), escapeCsvValue(lead.statusDistribution['On Track']),
      escapeCsvValue(lead.statusDistribution['At Risk']), escapeCsvValue(lead.statusDistribution['Delayed']),
      escapeCsvValue(lead.statusDistribution['Planning']),
    ].join(','));
    const csvString = [headers.join(','), ...rows].join('\r\n');
    downloadCSV(csvString, "team_overview_report.csv");
  };

  const handleDownloadCSV = () => {
    switch (activeTab) {
      case 'performance': handleDownloadPerformanceCSV(); break;
      case 'portfolio': handleDownloadPortfolioSummariesCSV(); break;
      case 'resources': handleDownloadTeamOverviewCSV(); break;
      default: toast({ title: "CSV Export", description: `CSV export is not available for the '${activeTab}' tab.`, variant: "default" });
    }
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

const isAnyFilterActive = searchTerm !== '' || selectedStatuses.size > 0 || selectedPriorities.size > 0 || selectedTeamLeads.size > 0 || selectedPortfolios.size > 0 || dateRange?.from;

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
        <ReportActions
          activeTab={activeTab}
          onDownloadCSV={handleDownloadCSV}
          onDownloadPDF={handleDownloadPDF}
          onShareViaEmail={handleShareViaEmail}
          isFiltered={isAnyFilterActive}
        />
      </div>

      <ReportFilters
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        selectedStatuses={selectedStatuses}
        onSelectedStatusesChange={setSelectedStatuses}
        selectedPriorities={selectedPriorities}
        onSelectedPrioritiesChange={setSelectedPriorities}
        selectedTeamLeads={selectedTeamLeads}
        onSelectedTeamLeadsChange={setSelectedTeamLeads}
        uniqueTeamLeads={uniqueTeamLeads}
        selectedPortfolios={selectedPortfolios}
        onSelectedPortfoliosChange={setSelectedPortfolios}
        uniquePortfolios={uniquePortfolios}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        onResetFilters={resetFilters}
      />

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
          <PerformanceReportTab
            filteredProjects={filteredProjects}
            projectMetrics={projectMetrics}
            isLoadingMetrics={isLoadingMetrics}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
          />
        </TabsContent>

        <TabsContent value="portfolio" className="mt-4">
          <PortfolioReportTab
            portfolioSummaries={portfolioSummaries}
            onViewPortfolioProjects={(summary) => {
              setSelectedPortfolioForModal(summary);
              setIsPortfolioModalOpen(true);
            }}
            formatCurrency={formatCurrency}
          />
        </TabsContent>

        <TabsContent value="resources" className="mt-4">
          <ResourceReportTab
            teamLeadWorkloads={teamLeadWorkloads}
            formatCurrency={formatCurrency}
          />
        </TabsContent>

        <TabsContent value="trends" className="mt-4">
           <TrendsReportTab
              filteredProjectCount={filteredProjects.length}
              calculatedTrendIndicators={calculatedTrendIndicators}
              trendsAndPredictions={trendsAndPredictions}
              isLoadingTrendsAndPredictions={isLoadingTrendsAndPredictions}
              trendsError={trendsError}
              onRefreshPredictions={fetchTrendsAndPredictions}
           />
        </TabsContent>
      </Tabs>

      <PortfolioDetailModal
        isOpen={isPortfolioModalOpen}
        onOpenChange={setIsPortfolioModalOpen}
        portfolioSummary={selectedPortfolioForModal}
        formatCurrency={formatCurrency}
        statusStyles={statusStyles}
        priorityColors={priorityColors}
        statusIcons={statusIcons}
      />
    </div>
  );
}
