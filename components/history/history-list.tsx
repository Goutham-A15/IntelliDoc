// NodeTest/components/history/history-list.tsx
"use client";

import React, { useEffect, useState } from "react";
import { fetchFromApi } from "@/lib/api-client";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Badge } from "@/components/ui/badge";
import { History as HistoryIcon, Eye, Trash2, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type HistoryItem = {
  id: string;
  created_at: string;
  document_names?: string[];
  results?: any;
  related_document_ids?: string[];
};

export function HistoryList({ onHistorySelect }: { onHistorySelect: (job: HistoryItem) => void }) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<HistoryItem | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const getHistory = async () => {
      try {
        const response = await fetchFromApi("/history");
        const data = await response.json();

        const normalized = (data.history || []).map((h: any) => {
          const copy = { ...h };
          if (typeof copy.results === "string") {
            try {
              copy.results = JSON.parse(copy.results);
            } catch (e) {
              copy.results = { summary: String(copy.results || ""), contradictions: [] };
            }
          }
          if (!copy.results) copy.results = { summary: "", contradictions: [] };
          if (!Array.isArray(copy.results.contradictions)) {
            copy.results.contradictions = [];
          }
          if (!copy.document_names) {
            copy.document_names = copy.related_document_ids || [];
          }
          return copy;
        });

        setHistory(normalized);
      } catch (err: any) {
        setError(err instanceof Error ? err.message : "Failed to load history.");
      } finally {
        setLoading(false);
      }
    };

    getHistory();
  }, []);
  
  // --- NEW: Function to handle the deletion ---
  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      await fetchFromApi(`/history/${itemToDelete.id}`, {
        method: 'DELETE',
      });

      setHistory((prev) => prev.filter((item) => item.id !== itemToDelete.id));
      toast({
        title: "Success",
        description: "History item deleted successfully.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete history item.",
        variant: "destructive",
      });
    } finally {
      setItemToDelete(null);
    }
  };

  if (loading) return <div className="text-center p-8">Loading history...</div>;
  if (error) return <div className="text-center text-red-500 p-8">{error}</div>;

  if (!history || history.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <HistoryIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium">No History Found</h3>
          <p className="text-muted-foreground">Perform a document comparison to see the results here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>Comparison Title</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="font-medium">
                    {Array.isArray(item.document_names) && item.document_names.length > 0
                      ? item.document_names.join(" vs ")
                      : "Comparison Result"}
                  </TableCell>
                  <TableCell>{format(new Date(item.created_at), "PPpp")}</TableCell>
                  <TableCell>
                    {item.results?.contradictions?.length > 0 ? (
                      <Badge variant="destructive">{item.results.contradictions.length} Contradictions</Badge>
                    ) : (
                      <Badge variant="default">Consistent</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {/* --- UPDATED: Actions buttons --- */}
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => onHistorySelect(item)}>
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setItemToDelete(item);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {/* --- END UPDATE --- */}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {/* --- NEW: Confirmation Dialog --- */}
      <AlertDialog open={!!itemToDelete} onOpenChange={(isOpen) => !isOpen && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex justify-center mb-2"><AlertTriangle className="h-10 w-10 text-destructive" /></div>
            <AlertDialogTitle className="text-center">Delete History Item?</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              This action cannot be undone. This will permanently delete the analysis record for:
              <br />
              <span className="font-semibold text-foreground mt-2 block">
                {itemToDelete?.document_names?.join(" vs ")}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete}>
              Yes, Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}