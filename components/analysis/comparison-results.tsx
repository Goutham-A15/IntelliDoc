// NodeTest/components/analysis/comparison-results.tsx
"use client"

import { useState, useEffect, useRef } from "react" 
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AlertTriangle, CheckCircle, Sparkles, Loader2 } from "lucide-react"
import { Badge } from "../ui/badge"
import { fetchFromApi } from "@/lib/api-client"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "../ui/button"

interface DocumentInput {
    id: string;
    name: string;
    text_storage_path?: string | null;
}

interface ComparisonResultsProps {
  documents: DocumentInput[];
  onAnalysisComplete: (result: AIAnalysisResult, documentIds: string[]) => void;
  initialData: AIAnalysisResult | null;
  runId: string | null;
}

interface ContradictionSource {
    documentName: string;
    statement: string;
}

interface Contradiction {
    id: string;
    explanation: string;
    severity?: 'low' | 'medium' | 'high';
    sources: ContradictionSource[];
}

interface AIAnalysisResult {
    summary: string;
    contradictions: Contradiction[];
}

export function ComparisonResults({ documents, onAnalysisComplete, initialData, runId }: ComparisonResultsProps) {
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [showOverloadDialog, setShowOverloadDialog] = useState(false);
  
  const processedRunIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (initialData || !runId || runId === processedRunIdRef.current) {
      return;
    }

    const runComparison = async () => {
      processedRunIdRef.current = runId;

      setLoading(true);
      setError(null);
      setAnalysisResult(null);

      try {
        const documentIds = documents.map(doc => doc.id);
        
        const response = await fetchFromApi('/analyze/comparison', {
            method: 'POST',
            body: JSON.stringify({ documentIds })
        });

        const data = await response.json();
        setAnalysisResult(data);
        onAnalysisComplete(data, documentIds);
      } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
          if (errorMessage.includes("model is overloaded")) {
              setShowOverloadDialog(true);
          } else {
              setError(errorMessage);
          }
      } finally {
        setLoading(false);
      }
    };

    runComparison();
  }, [runId, initialData, documents, onAnalysisComplete]);

  const getSeverityBadge = (severity?: Contradiction['severity']) => {
    const currentSeverity = severity || 'medium';
    const variants = { low: 'secondary', medium: 'default', high: 'destructive' } as const;
    const variantKey = variants[currentSeverity] ? currentSeverity : 'medium';
    return <Badge variant={variants[variantKey]}>{currentSeverity.charAt(0).toUpperCase() + currentSeverity.slice(1)}</Badge>;
  }

  const handleRetry = () => {
      setShowOverloadDialog(false);
      onAnalysisComplete({ summary: "", contradictions: [] }, []);
  }
  
  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center flex items-center justify-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p>Analyzing the Documents...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
        <Card><CardContent className="p-6 text-center text-red-600 flex items-center justify-center gap-3"><AlertTriangle className="h-5 w-5" /><p>{error}</p></CardContent></Card>
    )
  }

  if (!analysisResult) {
    return null;
  }

  return (
    <>
      <div className="space-y-6">
          <Card className="animate-in fade-in-50">
              <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-green-500" />AI Comparison Results</CardTitle>
                   <CardDescription>
                      Analysis of {documents.map(d => `"${d.name}"`).join(' vs ')}
                  </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                  <div>
                      <h3 className="font-semibold mb-2">Summary of Findings</h3>
                      <p className="text-sm text-muted-foreground italic">{analysisResult.summary}</p>
                  </div>

                  {analysisResult.contradictions.length > 0 ? (
                      <div className="space-y-4">
                          <h3 className="font-semibold">Contradictions Found ({analysisResult.contradictions.length})</h3>
                          {analysisResult.contradictions.map(item => (
                              <div key={item.id} className="p-4 border rounded-lg space-y-3">
                                  <div className="flex justify-between items-start">
                                      <p className="font-medium text-destructive">Contradiction Detected</p>
                                      {getSeverityBadge(item.severity)}
                                  </div>
                                  {item.sources && item.sources.map((source, index) => (
                                     <div key={index}>
                                         <label className="text-xs font-semibold text-muted-foreground">{source.documentName}</label>
                                         <blockquote className="mt-1 border-l-4 pl-3 text-sm bg-muted/50 p-2 rounded-r-md">"{source.statement}"</blockquote>
                                     </div>
                                  ))}
                                  <div>
                                      <label className="text-xs font-semibold">Explanation</label>
                                      <p className="text-sm text-muted-foreground mt-1">{item.explanation}</p>
                                  </div>
                              </div>
                          ))}
                      </div>
                  ) : (
                      <div className="flex flex-col items-center justify-center p-8 text-center bg-green-50/50 rounded-lg">
                          <CheckCircle className="h-10 w-10 text-green-600 mb-3" />
                          <h3 className="font-semibold">No Contradictions Found</h3>
                          <p className="text-sm text-muted-foreground mt-1">The AI analysis concluded that the documents are consistent with each other.</p>
                      </div>
                  )}
              </CardContent>
          </Card>
      </div>

      <AlertDialog open={showOverloadDialog} onOpenChange={setShowOverloadDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex justify-center mb-2"><AlertTriangle className="h-10 w-10 text-yellow-500" /></div>
            <AlertDialogTitle className="text-center">Model Overloaded</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              The AI model is currently experiencing high demand. Please try your comparison again in a few moments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-center">
            <AlertDialogAction asChild>
                <Button onClick={handleRetry}>Try Again</Button>
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}