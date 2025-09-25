// NodeTest/hooks/useGlobalSearch.ts
"use client";

import { useState, useMemo, useEffect } from "react";
import Fuse from "fuse.js";
import type { IFuseOptions, FuseResult } from "fuse.js";
import type { Doc } from "@/lib/docs";
import type { Document } from "@/lib/types/database";
import { fetchFromApi } from "@/lib/api-client";

export type SearchableItem =
  | { type: "doc"; data: Doc }
  | { type: "document"; data: Document };

const fuseOptions: IFuseOptions<SearchableItem> = {
  keys: [
    { name: "data.title", weight: 2 },
    { name: "data.filename", weight: 2 },
    { name: "data.excerpt", weight: 1 },
    { name: "data.content", weight: 0.5 },
  ],
  includeMatches: true,
  minMatchCharLength: 2,
  threshold: 0.4,
};

export function useGlobalSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchableList, setSearchableList] = useState<SearchableItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // Fetch docs from our new API route
        const docsResponse = await fetch("/api/docs");
        if (!docsResponse.ok) {
            throw new Error('Failed to fetch docs');
        }
        const docs = await docsResponse.json();
        const docItems: SearchableItem[] = (docs || []).map((d: Doc) => ({
          type: "doc",
          data: d,
        }));

        // Fetch user documents (API)
        const response = await fetchFromApi("/documents");
        const { documents } = await response.json();
        const documentItems: SearchableItem[] = (documents || []).map(
          (d: Document) => ({ type: "document", data: d })
        );

        setSearchableList([...docItems, ...documentItems]);
      } catch (error) {
        console.error("Failed to fetch search data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const fuse = useMemo(
    () => new Fuse(searchableList, fuseOptions),
    [searchableList]
  );

  const results: FuseResult<SearchableItem>[] = useMemo(() => {
    if (!searchTerm.trim()) {
      return [];
    }
    return fuse.search(searchTerm).slice(0, 10); // Limit to top 10 results
  }, [searchTerm, fuse]);

  return { searchTerm, setSearchTerm, results, loading };
}