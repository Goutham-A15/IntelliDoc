"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ComparisonResults } from "@/components/analysis/comparison-results";

type HistoryItem = {
  id: string;
  created_at: string;
  document_names?: string[];
  results?: any;
  related_document_ids?: string[];
};

interface HistoryDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  historyItem: HistoryItem | null;
}

export function HistoryDetailsModal({
  isOpen,
  onClose,
  historyItem,
}: HistoryDetailsModalProps) {
  if (!historyItem) {
    return null;
  }

  const documents = (historyItem.document_names || []).map((name, index) => ({
    id: historyItem.related_document_ids?.[index] || `doc-${index}`,
    name: name,
  }));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Comparison Details</DialogTitle>
          <DialogDescription>
            {historyItem.document_names?.join(" vs ")}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto">
          <ComparisonResults
            documents={documents}
            initialData={historyItem.results}
            onAnalysisComplete={() => {}}
            // Add this line to fix the error
            runId={null} 
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}