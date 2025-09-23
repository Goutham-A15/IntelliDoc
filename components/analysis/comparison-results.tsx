"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AlertTriangle, CheckCircle, Sparkles, Loader2 } from "lucide-react"
import { Badge } from "../ui/badge"
import { fetchFromApi } from "@/lib/api-client"

interface DocumentInput {
    id: string;
    name: string;
    text_storage_path?: string | null;
}

interface ComparisonResultsProps {
  documents: DocumentInput[];
  onAnalysisComplete: (result: AIAnalysisResult) => void;
  initialData: AIAnalysisResult | null;
}

interface Contradiction {
    id: string;
    statement1: string;
    statement2: string;
    explanation: string;
    severity?: 'low' | 'medium' | 'high';
}

interface AIAnalysisResult {
    summary: string;
    contradictions: Contradiction[];
}

async function fetchExtractedText(doc: DocumentInput): Promise<{id: string; name: string; text: string}> {
    if (!doc.text_storage_path) {
        throw new Error(`Text has not been extracted for "${doc.name}".`);
    }
    const response = await fetchFromApi('/documents/get-extracted-text', {
        method: 'POST',
        body: JSON.stringify({ textPath: doc.text_storage_path }),
    });
    if (!response.ok) throw new Error(`Server failed to fetch the text file for "${doc.name}".`);
    const text = await response.text();
    // Pass the ID through
    return { id: doc.id, name: doc.name, text };
}

export function ComparisonResults({ documents, onAnalysisComplete, initialData }: ComparisonResultsProps) {
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData || documents.length !== 2) return;

    const runComparison = async () => {
      setLoading(true);
      setError(null);
      setAnalysisResult(null);

      try {
        const [doc1, doc2] = await Promise.all(documents.map(fetchExtractedText));

        // --- FIX: Add the document IDs to the request body ---
        const response = await fetchFromApi('/analyze/comparison', {
            method: 'POST',
            body: JSON.stringify({
                document1: { name: doc1.name, text: doc1.text },
                document2: { name: doc2.name, text: doc2.text },
                documentIds: [doc1.id, doc2.id] // This was the missing piece
            })
        });
        // --- END FIX ---

        const data = await response.json();
        setAnalysisResult(data);
        onAnalysisComplete(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      } finally {
        setLoading(false);
      }
    };

    runComparison();
  }, [documents, initialData, onAnalysisComplete]);

  const getSeverityBadge = (severity?: Contradiction['severity']) => {
    const currentSeverity = severity || 'medium';
    const variants = { low: 'secondary', medium: 'default', high: 'destructive' } as const;
    const variantKey = variants[currentSeverity] ? currentSeverity : 'medium';
    return <Badge variant={variants[variantKey]}>{currentSeverity.charAt(0).toUpperCase() + currentSeverity.slice(1)}</Badge>;
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center flex items-center justify-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p>Gemini is analyzing the documents...</p>
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
    <div className="space-y-6">
        <Card className="animate-in fade-in-50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-green-500" />AI Comparison Results</CardTitle>
                 <CardDescription>
                    Analysis of "{documents[0].name}" vs "{documents[1].name}"
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
                                    {/* This call is now safe */}
                                    {getSeverityBadge(item.severity)}
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground">{documents[0].name}</label>
                                    <blockquote className="mt-1 border-l-4 pl-3 text-sm bg-muted/50 p-2 rounded-r-md">"{item.statement1}"</blockquote>
                                </div>
                                 <div>
                                    <label className="text-xs font-semibold text-muted-foreground">{documents[1].name}</label>
                                    <blockquote className="mt-1 border-l-4 pl-3 text-sm bg-muted/50 p-2 rounded-r-md">"{item.statement2}"</blockquote>
                                </div>
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
  );
}