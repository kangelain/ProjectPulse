
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
import { format, parseISO, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from "@/components/ui/button";
import { ListChecks, Briefcase, Users, TrendingUp, PieChart, UsersRound, AlertTriangle, Clock, CheckCircle2, Activity, Loader2, FileText, Download, Mail, FileType } from 'lucide-react';
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
}

interface TeamLeadWorkload {
  teamLead: string;
  projectCount: number;
  projects: Array<{ id: string; name: string; status: ProjectStatus, priority: Project['priority'], completionPercentage: number }>;
}

export default function ReportsPage() {
  const [projectMetrics, setProjectMetrics] = useState<Record<string, CalculatedProjectMetrics | null>>({});
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('performance');
  const { toast } = useToast();

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

  const portfolioSummaries = useMemo<PortfolioSummary[]>(() => {
    const portfolios: Record<string, PortfolioSummary> = {};
    mockProjects.forEach(p => {
      if (!portfolios[p.portfolio]) {
        portfolios[p.portfolio] = {
          portfolioName: p.portfolio,
          totalProjects: 0,
          averageCompletion: 0,
          totalBudget: 0,
          totalSpent: 0,
          budgetVariance: 0,
          statusCounts: { 'On Track': 0, 'At Risk': 0, 'Delayed': 0, 'Completed': 0, 'Planning': 0 },
        };
      }
      const summary = portfolios[p.portfolio];
      summary.totalProjects++;
      summary.averageCompletion += p.completionPercentage;
      summary.totalBudget += p.budget;
      summary.totalSpent += p.spent;
      summary.statusCounts[p.status]++;
    });

    return Object.values(portfolios).map(s => ({
      ...s,
      averageCompletion: s.totalProjects > 0 ? parseFloat((s.averageCompletion / s.totalProjects).toFixed(2)) : 0,
      budgetVariance: s.totalBudget - s.totalSpent,
    })).sort((a,b) => a.portfolioName.localeCompare(b.portfolioName));
  }, []);

  const teamLeadWorkloads = useMemo<TeamLeadWorkload[]>(() => {
    const leads: Record<string, TeamLeadWorkload> = {};
    mockProjects.forEach(p => {
      if (!leads[p.teamLead]) {
        leads[p.teamLead] = {
          teamLead: p.teamLead,
          projectCount: 0,
          projects: [],
        };
      }
      leads[p.teamLead].projectCount++;
      leads[p.teamLead].projects.push({ id: p.id, name: p.name, status: p.status, priority: p.priority, completionPercentage: p.completionPercentage });
    });
    return Object.values(leads).sort((a,b) => b.projectCount - a.projectCount);
  }, []);

  const formatDate = (dateString: string, csvFormat = false) => {
    try {
      return format(parseISO(dateString), csvFormat ? 'yyyy-MM-dd' : 'MMM dd, yyyy');
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

  const handleDownloadPerformanceCSV = () => {
    const headers = [
      "Project Name", "Status", "Priority", "Completion %", 
      "Budget (USD)", "Spent (USD)", "Variance (USD)", 
      "Start Date", "End Date", "Days Remaining/Overdue", "Team Lead"
    ];

    const rows = mockProjects.map(project => {
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
      ].join(',');
    });

    const csvString = [headers.join(','), ...rows].join('\r\n');
    
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) { 
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "project_performance_report.csv");
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const generateReportHTML = (tab: string): string => {
    let html = `<html><head><style>
      body { font-family: Helvetica, Arial, sans-serif; font-size: 10pt; color: #333; margin: 20px; }
      table { border-collapse: collapse; width: 100%; margin-bottom: 20px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
      th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; vertical-align: top; }
      th { background-color: #f8fafc; color: #4a5568; font-weight: 600; text-transform: uppercase; font-size: 0.85em;}
      tr:nth-child(even) { background-color: #f7fafc; }
      tr:hover { background-color: #edf2f7; }
      .currency { text-align: right; }
      .percentage { text-align: right; }
      .status-on-track { color: #38a169; } /* green-600 */
      .status-at-risk { color: #e53e3e; } /* red-600 */
      .status-delayed { color: #dd6b20; } /* orange-600 */
      .status-completed { color: #3182ce; } /* blue-600 */
      .status-planning { color: #718096; } /* gray-600 */
      .priority-high { color: #c53030; } /* red-700 */
      .priority-medium { color: #d69e2e; } /* yellow-700 */
      .priority-low { color: #2f855a; } /* green-700 */
      .variance-positive { color: #38a169; }
      .variance-negative { color: #e53e3e; }
      h1 { font-size: 1.8em; color: #2d3748; margin-bottom: 0.5em; }
      h2 { font-size: 1.4em; color: #4a5568; margin-bottom: 0.5em; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.3em; }
      .card { border: 1px solid #e2e8f0; border-radius: 0.375rem; padding: 1.5rem; margin-bottom: 1.5rem; background-color: #fff; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06); }
      .card-title { font-size: 1.25rem; font-weight: 600; margin-bottom: 0.25rem; color: #2d3748; }
      .card-description { font-size: 0.875rem; color: #718096; margin-bottom: 1rem; }
      .flex-container { display: flex; flex-wrap: wrap; gap: 1.5rem; }
      .flex-item { flex: 1 1 300px; }
      .progress-bar { background-color: #e2e8f0; border-radius: 0.25rem; height: 0.5rem; overflow: hidden; }
      .progress-bar-inner { background-color: #4299e1; height: 100%; }
    </style></head><body><h1>ProjectPulse Report - ${escapeHtml(tab.charAt(0).toUpperCase() + tab.slice(1))}</h1>`;

    if (tab === 'performance') {
      html += `<h2>Project Performance Details</h2><table>
        <thead><tr><th>Project Name</th><th>Status</th><th>Priority</th><th>Completion %</th><th>Budget</th><th>Spent</th><th>Variance</th><th>Start Date</th><th>End Date</th><th>Days Left/Overdue</th><th>Team Lead</th></tr></thead>
        <tbody>`;
      mockProjects.forEach(project => {
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
        </tr>`;
      });
      html += `</tbody></table>`;
    } else if (tab === 'portfolio') {
      html += `<h2>Portfolio Summaries</h2><div class="flex-container">`;
      portfolioSummaries.forEach(summary => {
        html += `<div class="card flex-item">
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
        <thead><tr><th>Team Lead</th><th>Project Count</th><th>Active Projects (Name, Status, Priority)</th></tr></thead>
        <tbody>`;
      teamLeadWorkloads.forEach(lead => {
        let projectsList = lead.projects
          .filter(p => p.status !== 'Completed')
          .map(p => `${escapeHtml(p.name)} (<span class="status-${p.status.toLowerCase().replace(' ', '-')}">${escapeHtml(p.status)}</span>, <span class="priority-${p.priority.toLowerCase()}">${escapeHtml(p.priority)}</span>)`)
          .join('<br>');
        if (lead.projects.filter(p => p.status === 'Completed').length > 0) {
          projectsList += `<br><em>+${lead.projects.filter(p => p.status === 'Completed').length} completed</em>`;
        }
        if (lead.projects.filter(p => p.status !== 'Completed').length === 0) {
          projectsList = '<em>No active projects.</em>';
        }
        html += `<tr>
          <td>${escapeHtml(lead.teamLead)}</td>
          <td style="text-align:center;">${escapeHtml(lead.projectCount)}</td>
          <td>${projectsList}</td>
        </tr>`;
      });
      html += `</tbody></table>`;
    }
    html += `</body></html>`;
    return html;
  };

  const handleShareViaEmail = () => {
    const reportHtml = generateReportHTML(activeTab);
    const subject = `ProjectPulse Report: ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`;
    const body = `
Please find the ${activeTab} report below.

Note: This report is best viewed in an HTML-compatible email client.

${reportHtml}
    `;
    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    if (mailtoLink.length > 2000) { // Check for mailto link length limits (approximate)
      toast({
        title: "Email Content Too Long",
        description: "The generated HTML report is too large to be sent directly via email. Please try downloading as CSV or PDF (when available).",
        variant: "destructive",
        duration: 7000,
      });
      // Fallback: Could offer to copy HTML to clipboard or download as .html file
    } else {
       window.location.href = mailtoLink;
    }
  };

  const handleDownloadPDF = () => {
    // PDF generation is a complex client-side task (e.g., using jsPDF, html2canvas).
    // For this demo, we'll just show a toast.
    toast({
      title: "PDF Download Not Implemented",
      description: "PDF generation is planned for a future update.",
      variant: "default",
      duration: 5000,
    });
  };


  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <FileText className="h-8 w-8 mr-3 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Project Reports</h1>
        </div>
      </div>
      

      <Tabs defaultValue="performance" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 gap-2 mb-6">
          <TabsTrigger value="performance" className="text-sm py-2.5">
            <ListChecks className="mr-2 h-4 w-4" /> Project Performance
          </TabsTrigger>
          <TabsTrigger value="portfolio" className="text-sm py-2.5">
            <Briefcase className="mr-2 h-4 w-4" /> Portfolio Summaries
          </TabsTrigger>
          <TabsTrigger value="resources" className="text-sm py-2.5">
            <UsersRound className="mr-2 h-4 w-4" /> Team Overview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="mt-6">
          <Card className="shadow-lg">
            <CardHeader className="pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-2xl">Project Performance Details</CardTitle>
                <CardDescription>Comprehensive overview of all projects, their status, and key metrics.</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleDownloadPerformanceCSV} size="sm" variant="outline">
                  <Download className="mr-2 h-4 w-4" /> CSV
                </Button>
                <Button onClick={handleDownloadPDF} size="sm" variant="outline" disabled>
                  <FileType className="mr-2 h-4 w-4" /> PDF
                </Button>
                <Button onClick={handleShareViaEmail} size="sm" variant="outline">
                  <Mail className="mr-2 h-4 w-4" /> Share
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <ScrollArea className="h-[600px] w-full">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                    <TableRow>
                      <TableHead className="w-[220px] py-3">Project Name</TableHead>
                      <TableHead className="py-3">Status</TableHead>
                      <TableHead className="py-3">Priority</TableHead>
                      <TableHead className="text-right py-3">Completion %</TableHead>
                      <TableHead className="text-right py-3">Budget</TableHead>
                      <TableHead className="text-right py-3">Spent</TableHead>
                      <TableHead className="text-right py-3">Variance</TableHead>
                      <TableHead className="py-3">Start Date</TableHead>
                      <TableHead className="py-3">End Date</TableHead>
                      <TableHead className="py-3">Days Left/Overdue</TableHead>
                      <TableHead className="py-3">Team Lead</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockProjects.map(project => {
                      const metrics = projectMetrics[project.id];
                      const StatusIcon = statusIcons[project.status];
                      let daysRemainingDisplay = <Loader2 className="h-4 w-4 animate-spin text-muted-foreground"/>;
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
                          <TableCell className="font-medium text-primary py-3">{project.name}</TableCell>
                          <TableCell className="py-3">
                            <Badge className={cn('text-xs px-2.5 py-1', statusColors[project.status])}>
                              <StatusIcon className="mr-1.5 h-3 w-3" />
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
                                <Progress value={project.completionPercentage} className="h-2 w-20" aria-label={`${project.completionPercentage}% complete`} />
                            </div>
                          </TableCell>
                          <TableCell className="text-right py-3">{formatCurrency(project.budget)}</TableCell>
                          <TableCell className="text-right py-3">{formatCurrency(project.spent)}</TableCell>
                          <TableCell className={cn("text-right py-3 font-medium", project.budget - project.spent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
                            {formatCurrency(project.budget - project.spent)}
                          </TableCell>
                          <TableCell className="py-3 text-muted-foreground">{formatDate(project.startDate)}</TableCell>
                          <TableCell className="py-3 text-muted-foreground">{formatDate(project.endDate)}</TableCell>
                          <TableCell className="py-3">
                            {daysRemainingDisplay}
                          </TableCell>
                          <TableCell className="py-3 text-muted-foreground">{project.teamLead}</TableCell>
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
           <Card className="shadow-lg mb-6">
             <CardHeader className="pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-2xl">Portfolio Summary Actions</CardTitle>
                <CardDescription>Download or share this portfolio summary.</CardDescription>
              </div>
              <div className="flex gap-2">
                 {/* CSV download might not be ideal for portfolio summary cards, so it's omitted here. */}
                <Button onClick={handleDownloadPDF} size="sm" variant="outline" disabled>
                  <FileType className="mr-2 h-4 w-4" /> PDF
                </Button>
                <Button onClick={handleShareViaEmail} size="sm" variant="outline">
                  <Mail className="mr-2 h-4 w-4" /> Share
                </Button>
              </div>
            </CardHeader>
           </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolioSummaries.map(summary => (
              <Card key={summary.portfolioName} className="shadow-lg flex flex-col">
                <CardHeader className="pb-3 pt-5">
                  <CardTitle className="text-xl text-primary">{summary.portfolioName}</CardTitle>
                  <CardDescription>{summary.totalProjects} projects</CardDescription>
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
                </CardContent>
              </Card>
            ))}
             {portfolioSummaries.length === 0 && (
                <Card className="md:col-span-2 lg:col-span-3 shadow-lg">
                    <CardContent className="text-center py-16">
                        <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground text-lg">No portfolio data available.</p>
                        <p className="text-sm text-muted-foreground">Projects might not be assigned to portfolios yet.</p>
                    </CardContent>
                </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="resources" className="mt-6">
          <Card className="shadow-lg">
            <CardHeader className="pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-2xl">Team Overview & Workload</CardTitle>
                <CardDescription>Breakdown of projects managed by each team lead.</CardDescription>
              </div>
              <div className="flex gap-2">
                {/* CSV download for team workload might be relevant if detailed project lists are included in CSV, but for simplicity, keeping consistent action buttons. */}
                <Button onClick={handleDownloadPDF} size="sm" variant="outline" disabled>
                  <FileType className="mr-2 h-4 w-4" /> PDF
                </Button>
                <Button onClick={handleShareViaEmail} size="sm" variant="outline">
                  <Mail className="mr-2 h-4 w-4" /> Share
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <ScrollArea className="h-[600px] w-full">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                    <TableRow>
                      <TableHead className="w-[200px] py-3">Team Lead</TableHead>
                      <TableHead className="text-center w-[120px] py-3">Project Count</TableHead>
                      <TableHead className="py-3">Active Projects (Status & Priority)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamLeadWorkloads.map(lead => (
                      <TableRow key={lead.teamLead} className="hover:bg-muted/30">
                        <TableCell className="font-medium py-3">{lead.teamLead}</TableCell>
                        <TableCell className="text-center py-3">{lead.projectCount}</TableCell>
                        <TableCell className="py-3">
                          <div className="flex flex-wrap gap-2">
                            {lead.projects.filter(p => p.status !== 'Completed').map(p => (
                               <TooltipProvider key={p.id} delayDuration={100}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge variant="secondary" className="cursor-default text-xs font-normal px-2 py-1 hover:bg-muted">
                                      <span className="truncate max-w-[150px] mr-1.5">{p.name}</span>
                                      <Badge className={cn('text-[0.65rem] leading-tight py-0 px-1', statusColors[p.status])}>
                                        {p.status.substring(0,1)}
                                      </Badge>
                                      <Badge variant="outline" className={cn("ml-1 text-[0.65rem] leading-tight py-0 px-1", priorityColors[p.priority])}>
                                        {p.priority.substring(0,1)}
                                      </Badge>
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent className="text-xs p-2 bg-popover shadow-md rounded-md border">
                                    <p className="font-semibold">{p.name}</p>
                                    <p className="text-muted-foreground">Status: {p.status}</p>
                                    <p className="text-muted-foreground">Priority: {p.priority}</p>
                                    <p className="text-muted-foreground">Completion: {p.completionPercentage}%</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ))}
                             {lead.projects.filter(p => p.status === 'Completed').length > 0 && (
                                <Badge variant="outline" className="text-xs font-normal px-2 py-1 border-dashed">
                                    +{lead.projects.filter(p => p.status === 'Completed').length} completed
                                </Badge>
                             )}
                             {lead.projects.filter(p => p.status !== 'Completed').length === 0 && (
                                <span className="text-sm text-muted-foreground italic">No active projects.</span>
                             )}
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
    </div>
  );
}


