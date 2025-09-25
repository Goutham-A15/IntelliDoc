// NodeTest/components/reports/detailed-reports-table.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, FileDown, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { fetchFromApi } from "@/lib/api-client";
import type { Report } from "./types";


interface DetailedReportsTableProps {
  reports: Report[];
  onViewDetails: (report: Report) => void;
}

export function DetailedReportsTable({ reports, onViewDetails }: DetailedReportsTableProps) {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (reports.length === 0) {
        toast({ title: "No Reports", description: "There are no reports to export." });
        return;
    }
    setIsExporting(true);
    try {
        const response = await fetchFromApi("/reports/export", {
            method: 'POST',
            body: JSON.stringify({ reports }),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'SmartDocChecker_Reports.pdf';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({ title: "Export Successful", description: "Your PDF report has been downloaded." });
    } catch (error) {
        console.error("Export failed:", error);
        toast({
            title: "Export Failed",
            description: "Could not generate the PDF report.",
            variant: "destructive"
        });
    } finally {
        setIsExporting(false);
    }
};

  return (
    <div>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Detailed Reports</h2>
            <Button variant="outline" onClick={handleExport} disabled={isExporting}>
                {isExporting ? (
                    <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Exporting...
                    </>
                ) : (
                    <>
                        <FileDown className="h-4 w-4 mr-2" />
                        Export as PDF
                    </>
                )}
            </Button>
        </div>
        <Card>
            <CardContent>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead className="w-[80px]">Serial No.</TableHead>
                    <TableHead>Document Names</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {reports.map((report, index) => (
                    <TableRow key={report.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">
                        {(report.document_names || []).join(" vs ")}
                    </TableCell>
                    <TableCell>
                        {format(new Date(report.created_at), "PPpp")}
                    </TableCell>
                    <TableCell>
                        <Badge variant={report.status === 'completed' ? 'default' : 'destructive'}>
                            {report.status}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => onViewDetails(report)}>
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                        </Button>
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            </CardContent>
        </Card>
    </div>
  );
}