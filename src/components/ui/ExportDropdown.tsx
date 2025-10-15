import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, ChevronDown, FileSpreadsheet, FileText } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface Profile {
  _id: string;
  name: string;
  title: string;
  company: string;
  location: string;
  email?: string;
  linkedinUrl: string;
  relevanceScore?: number;
  projectId?: { name: string };
  analysis?: { score: number };
}

interface ExportDropdownProps {
  profiles: Profile[];
  selectedProfiles: string[];
  fileName: string;
  className?: string;
  size?: 'default' | 'sm';
}

export const ExportDropdown: React.FC<ExportDropdownProps> = ({
  profiles,
  selectedProfiles,
  fileName,
  className = "",
  size = "default"
}) => {
  const [isExporting, setIsExporting] = useState(false);

  const getProfilesToExport = () => {
    return selectedProfiles.length > 0
      ? profiles.filter(profile => selectedProfiles.includes(profile._id))
      : profiles;
  };

  const getFormattedData = () => {
    const profilesToExport = getProfilesToExport();

    if (profilesToExport.length === 0) {
      toast.error("No profiles to export");
      return null;
    }

    const headers = [
      "Name",
      "Title",
      "Company",
      "Location",
      "Project",
      "Email Address",
      "LinkedIn URL",
      "Relevance Score",
      "Deep Analysis Score"
    ];

    const rows = profilesToExport.map(profile => ([
      profile.name || '',
      profile.title || '',
      profile.company || '',
      profile.location || '',
      profile.projectId?.name || 'N/A',
      profile.email || '',
      profile.linkedinUrl || '',
      profile.relevanceScore?.toString() || 'N/A',
      profile.analysis?.score?.toString() || 'N/A'
    ]));

    return { headers, rows, count: profilesToExport.length };
  };

  const exportToCSV = () => {
    const data = getFormattedData();
    if (!data) return;

    const { headers, rows, count } = data;

    // Use tab-separated values (TSV) for better column formatting
    // This creates clean columns when opened in Excel or other spreadsheet programs
    const escapeTSV = (value: string) => {
      // Replace tabs with spaces and handle newlines
      return String(value || '').replace(/\t/g, ' ').replace(/\n/g, ' ').replace(/\r/g, '');
    };

    // Create header row with tabs
    const headerRow = headers.map(escapeTSV).join('\t');

    // Create data rows with tabs
    const dataRows = rows.map(row =>
      row.map(cell => escapeTSV(String(cell || ''))).join('\t')
    );

    // Combine all content with tab separators
    const tsvContent = [headerRow, ...dataRows].join('\n');

    // Create CSV file with tab separators (TSV format)
    const blob = new Blob([tsvContent], {
      type: "text/csv;charset=utf-8;"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${fileName}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${count} profiles to CSV with column formatting`);
  };

  const exportToXLSX = () => {
    const data = getFormattedData();
    if (!data) return;

    const { headers, rows, count } = data;

    // Create a new workbook
    const wb = XLSX.utils.book_new();

    // Create worksheet data with headers and rows
    const wsData = [headers, ...rows];

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths for better formatting
    const colWidths = [
      { wch: 20 }, // Name
      { wch: 25 }, // Title
      { wch: 20 }, // Company
      { wch: 15 }, // Location
      { wch: 15 }, // Project
      { wch: 25 }, // Email
      { wch: 40 }, // LinkedIn URL
      { wch: 12 }, // Relevance Score
      { wch: 15 }  // Deep Analysis Score
    ];
    ws['!cols'] = colWidths;

    // Style the header row
    const headerRange = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!ws[cellRef]) continue;

      ws[cellRef].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "366092" } },
        alignment: { horizontal: "center", vertical: "center" }
      };
    }

    // Add the worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "Profiles");

    // Save the file
    XLSX.writeFile(wb, `${fileName}_${Date.now()}.xlsx`);

    toast.success(`Exported ${count} profiles to Excel`);
  };



  const handleExport = async (format: 'csv' | 'xlsx') => {
    setIsExporting(true);

    try {
      switch (format) {
        case 'csv':
          exportToCSV();
          break;
        case 'xlsx':
          exportToXLSX();
          break;
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const profileCount = selectedProfiles.length > 0 ? selectedProfiles.length : profiles.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={size}
          className={`flex items-center gap-1 ${size === 'sm'
              ? 'text-xs h-8 px-3'
              : 'text-sm font-medium gap-2'
            } ${className}`}
          disabled={isExporting || profiles.length === 0}
        >
          <Download className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
          Export ({profileCount})
          <ChevronDown className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => handleExport('csv')} disabled={isExporting}>
          <FileText className="h-4 w-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('xlsx')} disabled={isExporting}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export as Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}; 