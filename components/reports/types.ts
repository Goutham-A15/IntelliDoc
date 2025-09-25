// NodeTest/components/reports/types.ts
export interface SummaryData {
  totalComparisons: number;
  totalConflicts: number;
  conflictPercentage: number;
}

export interface InsightsData {
  comparisonsOverTime: { date: string; comparisons: number }[];
}

export interface Report {
  id: string;
  created_at: string;
  document_names: string[];
  status: 'completed' | 'failed' | 'processing';
  results: any;
  related_document_ids?: string[];
}