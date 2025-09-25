// NodeTest/components/documents/document-list.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, FileText, Calendar, GitCompareArrows, Eye, Check, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Document, AnalysisJob } from "@/lib/types/database";
import { FileViewer } from "./file-viewer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { fetchFromApi } from "@/lib/api-client";

interface DocumentWithAnalysis extends Document {
  analysis_jobs: AnalysisJob[];
}

interface DocumentListProps {
  onCompare: (documents: { id: string; name: string; text_storage_path?: string | null }[]) => void;
  onDelete: (documentId: string) => void;
  refreshTrigger?: number;
  comparisonCompletedIds?: string[];
}

const formatFileSize = (size: number) => {
    if (size === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(size) / Math.log(k));
    return parseFloat((size / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const getStatusBadge = (jobs: AnalysisJob[], isCompleted: boolean) => {
    if (isCompleted) return <Badge variant="default">Comparison Completed</Badge>;
    if (jobs.length === 0) return <Badge variant="secondary">Not Analyzed</Badge>;
    const latestJob = jobs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
    switch (latestJob.status) {
        case "completed": return <Badge variant="default">Analyzed</Badge>;
        case "processing": return <Badge variant="outline">Processing</Badge>;
        case "failed": return <Badge variant="destructive">Failed</Badge>;
        default: return <Badge variant="secondary">Pending</Badge>;
    }
};

export function DocumentList({ onCompare, onDelete, refreshTrigger, comparisonCompletedIds = [] }: DocumentListProps) {
  const [documents, setDocuments] = useState<DocumentWithAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null);
  const [documentToDelete, setDocumentToDelete] = useState<DocumentWithAnalysis | null>(null);
  const { toast } = useToast();

 const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetchFromApi("/documents");
      const data = await response.json();
      setDocuments(data.documents);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [refreshTrigger, fetchDocuments]);

  const handleDelete = async (documentId: string) => {
    try {
      await fetchFromApi(`/documents/${documentId}`, {
        method: "DELETE",
      });
      setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
      onDelete(documentId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete document");
    } finally {
      setDocumentToDelete(null);
    }
  };

  const handleSelectForComparison = (doc: DocumentWithAnalysis) => {
    setSelectedForComparison(prev => {
        const isSelected = prev.includes(doc.id);
        if (isSelected) {
            return prev.filter(id => id !== doc.id);
        }
        return [...prev, doc.id];
    });
  };

  const handleCompareClick = async () => {
    if (selectedForComparison.length >= 2) {
        const docsToCompare = documents
            .filter(doc => selectedForComparison.includes(doc.id))
            .map(doc => ({
                id: doc.id,
                name: doc.filename,
                text_storage_path: doc.text_storage_path
            }));
        
        onCompare(docsToCompare);
    } else {
        toast({
            title: "Select Documents",
            description: "Please select at least two documents to compare.",
            variant: "destructive"
        })
    }
  };

  if (loading) return <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  if (error) return <Card><CardContent className="p-6 text-center"><p className="text-red-500">{error}</p><Button onClick={fetchDocuments} className="mt-4">Try Again</Button></CardContent></Card>;
  if (documents.length === 0) return <Card><CardContent className="p-8 text-center"><FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" /><h3 className="text-lg font-medium mb-2">No documents found</h3><p className="text-muted-foreground">Upload your first document to get started.</p></CardContent></Card>;

  return (
    <div className="space-y-4">
       <p className="text-sm text-muted-foreground">Select two or more documents you want to compare.</p>
      {viewingDocument && <FileViewer document={viewingDocument} onClose={() => setViewingDocument(null)} />}
        {selectedForComparison.length >= 2 && (
          <div className="p-4 bg-primary/10 rounded-lg flex items-center justify-between animate-in fade-in-50">
              <p className="text-sm font-medium">Ready to compare {selectedForComparison.length} documents.</p>
              <Button size="sm" onClick={handleCompareClick}><GitCompareArrows className="h-4 w-4 mr-2" />Compare Now</Button>
          </div>
        )}
      {documents.map((document) => {
        const isSelectedForComparison = selectedForComparison.includes(document.id);
        const isComparisonCompleted = comparisonCompletedIds.includes(document.id);

        return (
        <Card
            key={document.id}
            className={cn("transition-all", isSelectedForComparison ? "border-primary ring-2 ring-primary ring-offset-2" : "", isComparisonCompleted ? "border-green-500" : "")}
        >
          <CardHeader className="pb-3 cursor-pointer" onClick={() => handleSelectForComparison(document)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className={cn("w-5 h-5 rounded-md flex items-center justify-center border-2 transition-all", isSelectedForComparison ? "bg-primary border-primary text-primary-foreground" : "bg-transparent border-muted-foreground")}>
                    {isSelectedForComparison && <Check className="h-4 w-4" />}
                 </div>
                <CardTitle className="text-lg font-medium">{document.filename}</CardTitle>
              </div>
              {getStatusBadge(document.analysis_jobs, isComparisonCompleted)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{formatFileSize(document.file_size)}</span>
                <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{formatDistanceToNow(new Date(document.created_at), { addSuffix: true })}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setViewingDocument(document); }}><Eye className="h-4 w-4 mr-2" />View</Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setDocumentToDelete(document); }}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )})}
      <AlertDialog open={!!documentToDelete} onOpenChange={(isOpen) => !isOpen && setDocumentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex justify-center"><AlertTriangle className="h-10 w-10 text-destructive mb-2" /></div>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>This action will permanently delete the document <span className="font-bold">{documentToDelete?.filename}</span> and all associated data.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDocumentToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => { if(documentToDelete) handleDelete(documentToDelete.id) }}>Yes, delete document</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}