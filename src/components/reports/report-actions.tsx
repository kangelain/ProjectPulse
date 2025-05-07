'use client';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Download, FileType, Mail } from 'lucide-react';

interface ReportActionsProps {
  activeTab: string;
  onDownloadCSV: () => void;
  onDownloadPDF: () => void;
  onShareViaEmail: () => void;
  isFiltered: boolean; // To potentially reflect in button text or behavior
}

export function ReportActions({
  activeTab,
  onDownloadCSV,
  onDownloadPDF,
  onShareViaEmail,
  isFiltered,
}: ReportActionsProps) {
  const { toast } = useToast();

  const handleDownloadCsvClick = () => {
    if (activeTab === 'trends') {
        toast({ title: "CSV Export N/A", description: "AI predictions are best viewed online or in HTML format.", variant: "default"});
        return;
    }
    onDownloadCSV();
  };
  
  return (
    <div className="flex gap-2 flex-wrap sm:flex-nowrap">
      <Button
        onClick={handleDownloadCsvClick}
        size="sm"
        variant="outline"
        title={`Download ${activeTab} view as CSV ${isFiltered ? "(Filtered)" : ""}`}
        className="h-9 px-3 text-xs"
      >
        <Download className="mr-1.5 h-3.5 w-3.5" /> CSV
      </Button>
      <Button
        onClick={onDownloadPDF}
        size="sm"
        variant="outline"
        title={`Download ${activeTab} view as PDF ${isFiltered ? "(Filtered)" : ""} (via Print)`}
        className="h-9 px-3 text-xs"
      >
        <FileType className="mr-1.5 h-3.5 w-3.5" /> PDF
      </Button>
      <Button
        onClick={onShareViaEmail}
        size="sm"
        variant="outline"
        title={`Share ${activeTab} view via Email ${isFiltered ? "(Filtered)" : ""}`}
        className="h-9 px-3 text-xs"
      >
        <Mail className="mr-1.5 h-3.5 w-3.5" /> Share
      </Button>
    </div>
  );
}
