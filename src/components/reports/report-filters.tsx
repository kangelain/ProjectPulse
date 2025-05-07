'use client';

import * as React from 'react';
import type { Project, ProjectStatus } from '@/types/project';
import type { DateRange } from 'react-day-picker';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/date-range-picker';
import { MultiSelectFilter } from './multi-select-filter';
import { XCircle, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ALL_STATUSES = ['On Track', 'At Risk', 'Delayed', 'Completed', 'Planning'] as ProjectStatus[];
const ALL_PRIORITIES = ['High', 'Medium', 'Low'] as Project['priority'][];

interface ReportFiltersProps {
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  selectedStatuses: Set<ProjectStatus>;
  onSelectedStatusesChange: (statuses: Set<ProjectStatus>) => void;
  selectedPriorities: Set<Project['priority']>;
  onSelectedPrioritiesChange: (priorities: Set<Project['priority']>) => void;
  selectedTeamLeads: Set<string>;
  onSelectedTeamLeadsChange: (leads: Set<string>) => void;
  uniqueTeamLeads: string[];
  selectedPortfolios: Set<string>;
  onSelectedPortfoliosChange: (portfolios: Set<string>) => void;
  uniquePortfolios: string[];
  dateRange: DateRange | undefined;
  onDateRangeChange: (dateRange: DateRange | undefined) => void;
  onResetFilters: () => void;
}

export function ReportFilters({
  searchTerm,
  onSearchTermChange,
  selectedStatuses,
  onSelectedStatusesChange,
  selectedPriorities,
  onSelectedPrioritiesChange,
  selectedTeamLeads,
  onSelectedTeamLeadsChange,
  uniqueTeamLeads,
  selectedPortfolios,
  onSelectedPortfoliosChange,
  uniquePortfolios,
  dateRange,
  onDateRangeChange,
  onResetFilters,
}: ReportFiltersProps) {

  const handleMultiSelectToggle = <T extends string>(
    currentSet: Set<T>,
    item: T,
    setter: (newSet: Set<T>) => void
  ) => {
    const newSet = new Set(currentSet);
    if (newSet.has(item)) {
      newSet.delete(item);
    } else {
      newSet.add(item);
    }
    setter(newSet);
  };

  return (
    <Card className="mb-6 shadow-md">
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5">
          <CardTitle className="text-md font-semibold">Filter Options</CardTitle>
          <Button variant="ghost" size="sm" onClick={onResetFilters} className="text-xs text-muted-foreground hover:text-primary h-7 px-2">
            <XCircle className="mr-1 h-3 w-3" /> Reset Filters
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 items-end pb-4 px-4">
        <Input
          placeholder="Search projects..."
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
          className="h-9 text-xs"
          prependIcon={<Search className="h-3.5 w-3.5 text-muted-foreground" />}
        />
        <MultiSelectFilter
          title="Status"
          options={ALL_STATUSES}
          selectedValues={selectedStatuses}
          onValueChange={(status) => handleMultiSelectToggle(selectedStatuses, status as ProjectStatus, onSelectedStatusesChange)}
          onClear={() => onSelectedStatusesChange(new Set())}
          buttonClassName="h-9 text-xs w-full"
        />
        <MultiSelectFilter
          title="Priority"
          options={ALL_PRIORITIES}
          selectedValues={selectedPriorities}
          onValueChange={(priority) => handleMultiSelectToggle(selectedPriorities, priority as Project['priority'], onSelectedPrioritiesChange)}
          onClear={() => onSelectedPrioritiesChange(new Set())}
          buttonClassName="h-9 text-xs w-full"
        />
        <MultiSelectFilter
          title="Team Lead"
          options={uniqueTeamLeads}
          selectedValues={selectedTeamLeads}
          onValueChange={(lead) => handleMultiSelectToggle(selectedTeamLeads, lead, onSelectedTeamLeadsChange)}
          onClear={() => onSelectedTeamLeadsChange(new Set())}
          buttonClassName="h-9 text-xs w-full"
        />
        <MultiSelectFilter
          title="Portfolio"
          options={uniquePortfolios}
          selectedValues={selectedPortfolios}
          onValueChange={(portfolio) => handleMultiSelectToggle(selectedPortfolios, portfolio, onSelectedPortfoliosChange)}
          onClear={() => onSelectedPortfoliosChange(new Set())}
          buttonClassName="h-9 text-xs w-full"
        />
        <DateRangePicker date={dateRange} onDateChange={onDateRangeChange} buttonClassName="h-9 text-xs w-full" />
      </CardContent>
    </Card>
  );
}
