'use client';

import type { PortfolioSummary, Project, ProjectStatus } from '@/types/project-reports'; // Assuming types are moved or defined here
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { statusStyles as defaultStatusStyles, priorityColors as defaultPriorityColors, statusIcons as defaultStatusIcons } from '@/app/reports/report-style-definitions'; // Adjust path if needed

interface PortfolioDetailModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  portfolioSummary: PortfolioSummary | null;
  formatCurrency: (amount: number) => string;
  statusStyles?: typeof defaultStatusStyles;
  priorityColors?: typeof defaultPriorityColors;
  statusIcons?: typeof defaultStatusIcons;
}

export function PortfolioDetailModal({
  isOpen,
  onOpenChange,
  portfolioSummary,
  formatCurrency,
  statusStyles = defaultStatusStyles,
  priorityColors = defaultPriorityColors,
  statusIcons = defaultStatusIcons,
}: PortfolioDetailModalProps) {
  if (!portfolioSummary) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[80vh]">
        <DialogHeader className="px-4 pt-4 pb-3">
          <DialogTitle className="text-xl">Projects in: {portfolioSummary.portfolioName}</DialogTitle>
          <DialogDescription className="text-xs">
            Detailed list of projects within this portfolio, reflecting current global filters.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] px-4">
          {portfolioSummary.projects.length > 0 ? (
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
                {portfolioSummary.projects.map(project => {
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
                        {formatCurrency(project.budget)}
                      </TableCell>
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
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="h-9 text-xs">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
