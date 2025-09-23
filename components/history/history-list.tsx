"use client"

import { useState, useEffect } from "react";
import { fetchFromApi } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// CORRECTED: Renamed the imported 'History' icon to 'HistoryIcon'
import { FileText, Calendar, AlertTriangle, CheckCircle, History as HistoryIcon } from "lucide-react";
import { format } from "date-fns";

// Define the types for our history data
interface HistoryItem {
    id: string;
    created_at: string;
    document_names: string[];
    results: {
        summary: string;
        contradictions: any[];
    }
}

export function HistoryList() {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const getHistory = async () => {
            try {
                setLoading(true);
                const response = await fetchFromApi('/history');
                const data = await response.json();
                setHistory(data.history);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load history.");
            } finally {
                setLoading(false);
            }
        };
        getHistory();
    }, []);

    if (loading) {
        return <div className="text-center p-8">Loading history...</div>;
    }

    if (error) {
        return <div className="text-center text-red-500 p-8">{error}</div>;
    }

    if (history.length === 0) {
        return (
            <Card>
                <CardContent className="p-8 text-center">
                    {/* CORRECTED: Use the new alias 'HistoryIcon' */}
                    <HistoryIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium">No History Found</h3>
                    <p className="text-muted-foreground">Perform a document comparison to see the results here.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {history.map(item => (
                <Card key={item.id}>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-lg">
                                    {item.document_names.join(' vs ')}
                                </CardTitle>
                                <CardDescription className="flex items-center gap-2 mt-1">
                                    <Calendar className="h-4 w-4" />
                                    {format(new Date(item.created_at), "PPP p")}
                                </CardDescription>
                            </div>
                            {item.results.contradictions.length > 0 ? (
                                <Badge variant="destructive" className="flex items-center gap-1">
                                    <AlertTriangle className="h-4 w-4" />
                                    {item.results.contradictions.length} Contradictions
                                </Badge>
                            ) : (
                                <Badge variant="default" className="flex items-center gap-1 bg-green-600">
                                    <CheckCircle className="h-4 w-4" />
                                    Consistent
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground italic">
                           "{item.results.summary}"
                        </p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}