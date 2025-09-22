"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2, FileText, Calendar, GitCompareArrows, Eye, Check, AlertTriangle, MessageSquareCode } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import type { Document, AnalysisJob } from "@/lib/types/database"
import { FileViewer } from "./file-viewer"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

// CORRECTED: This interface was missing.
interface DocumentWithAnalysis extends Document {
  analysis_jobs: AnalysisJob[]
}

// CORRECTED: The onCompare prop now matches the data being sent.
interface DocumentListProps {
  onCompare: (documents: { id: string; name: string; text_storage_path?: string | null }[]) => void;
  onDelete: (documentId: string) => void
  refreshTrigger?: number
}

const formatFileSize = (size: number) => {
    if (size === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(size) / Math.log(k));
    return parseFloat((size / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

const getStatusBadge = (jobs: AnalysisJob[]) => {
    if (jobs.length === 0) return <Badge variant="secondary">Not Analyzed</Badge>
    const latestJob = jobs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
    switch (latestJob.status) {
        case "completed": return <Badge variant="default">Analyzed</Badge>
        case "processing": return <Badge variant="outline">Processing</Badge>
        case "failed": return <Badge variant="destructive">Failed</Badge>
        default: return <Badge variant="secondary">Pending</Badge>
    }
}

export function DocumentList({ onCompare, onDelete, refreshTrigger }: DocumentListProps) {
  const [documents, setDocuments] = useState<DocumentWithAnalysis[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]); // CORRECTED: Added this missing state
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null);
  const [documentToDelete, setDocumentToDelete] = useState<DocumentWithAnalysis | null>(null);
  const [isExtracting, setIsExtracting] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/documents")
      if (!response.ok) {
        throw new Error("Failed to fetch documents")
      }
      const data = await response.json()
      setDocuments(data.documents)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load documents")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [refreshTrigger])


  const handleDelete = async (documentId: string) => {
    try {
      const response = await fetch(`/api/documents?id=${documentId}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        throw new Error("Failed to delete document")
      }
      setDocuments((prev) => prev.filter((doc) => doc.id !== documentId))
      onDelete(documentId)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete document")
    } finally {
      setDocumentToDelete(null);
    }
  }

  const handleSelectForComparison = (doc: DocumentWithAnalysis) => {
    // 1. Check if the text has been extracted for the selected document.
    if (!doc.text_storage_path) {
      toast({
        title: "Text Not Extracted",
        description: `Please click "Extract Text" for "${doc.filename}" before selecting it for comparison.`,
        variant: "destructive",
      });
      return; // Stop the function here
    }

    // 2. If text is extracted, proceed with the selection logic.
    setSelectedForComparison(prev => {
        const isSelected = prev.includes(doc.id);
        if (isSelected) {
            return prev.filter(id => id !== doc.id);
        }
        if(prev.length < 2) {
            return [...prev, doc.id];
        }
        // Replace the oldest selection with the new one
        return [prev[1], doc.id];
    });
  }

  const handleCompareClick = () => {
    if (selectedForComparison.length === 2) {
        const docsToCompare = documents
            .filter(doc => selectedForComparison.includes(doc.id))
            .map(doc => ({ 
                id: doc.id, 
                name: doc.filename,
                text_storage_path: doc.text_storage_path
            }));
      onCompare(docsToCompare);
    }
  };

  const handleExtractText = async (document: DocumentWithAnalysis) => {
    setIsExtracting(document.id);
    toast({ title: "Extraction Started", description: `Extracting text from "${document.filename}"...` });

    try {
        const response = await fetch("/api/documents/extract-and-save-text", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ documentId: document.id }),
        });

        if (!response.ok) {
            const result = await response.json();
            throw new Error(result.error || "An unknown server error occurred.");
        }

        toast({
            title: "Extraction Successful!",
            description: `Text from "${document.filename}" is now ready for comparison.`,
        });
        
        fetchDocuments(); // Refresh list to show the "Ready to Compare" badge

    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to extract text.";
        toast({ title: "Extraction Failed", description: errorMessage, variant: "destructive" });
    } finally {
        setIsExtracting(null);
    }
  };

  if (loading) return <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
  if (error) return <Card><CardContent className="p-6 text-center"><p className="text-red-500">{error}</p><Button onClick={fetchDocuments} className="mt-4">Try Again</Button></CardContent></Card>
  if (documents.length === 0) return <Card><CardContent className="p-8 text-center"><FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" /><h3 className="text-lg font-medium mb-2">No documents found</h3><p className="text-muted-foreground">Upload your first document to get started.</p></CardContent></Card>

  return (
    <div className="space-y-4">
      {viewingDocument && <FileViewer document={viewingDocument} onClose={() => setViewingDocument(null)} />}
      {selectedForComparison.length === 2 && (
          <div className="p-4 bg-primary/10 rounded-lg flex items-center justify-between animate-in fade-in-50">
              <p className="text-sm font-medium">Ready to compare 2 documents.</p>
              <Button size="sm" onClick={handleCompareClick}><GitCompareArrows className="h-4 w-4 mr-2" />Compare Now</Button>
          </div>
      )}
      {documents.map((document) => {
        const isSelectedForComparison = selectedForComparison.includes(document.id);
        const isTextExtracted = !!document.text_storage_path;
        return (
        <Card 
            key={document.id} 
            className={cn("transition-all", isSelectedForComparison ? "border-primary ring-2 ring-primary ring-offset-2" : "")}
        >
          <CardHeader className="pb-3 cursor-pointer" onClick={() => handleSelectForComparison(document)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className={cn("w-5 h-5 rounded-md flex items-center justify-center border-2 transition-all", isSelectedForComparison ? "bg-primary border-primary text-primary-foreground" : "bg-transparent border-muted-foreground")}>
                    {isSelectedForComparison && <Check className="h-4 w-4" />}
                 </div>
                <CardTitle className="text-lg font-medium">{document.filename}</CardTitle>
                {isTextExtracted && <Badge variant="secondary">Ready to Compare</Badge>}
              </div>
              {getStatusBadge(document.analysis_jobs)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{formatFileSize(document.file_size)}</span>
                <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{formatDistanceToNow(new Date(document.created_at), { addSuffix: true })}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleExtractText(document); }} disabled={isExtracting === document.id}>
                    {isExtracting === document.id ? (<div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2" />) : (<MessageSquareCode className="h-4 w-4 mr-2" />)}
                    Extract Text
                </Button>
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