"use client";

import { useState, useMemo } from "react";
import Fuse, { IFuseOptions } from "fuse.js";
import type { Doc } from "@/lib/docs";

const fuseOptions: IFuseOptions<Doc> = {
  keys: ["title", "excerpt", "content"],
  includeMatches: true,
  minMatchCharLength: 2,
  threshold: 0.3,
};

export function useDocsSearch(docs: Doc[]) {
  const [searchTerm, setSearchTerm] = useState("");
  const fuse = useMemo(() => new Fuse(docs, fuseOptions), [docs]);

  const results = useMemo(() => {
    if (!searchTerm.trim()) {
      return docs.map((doc, index) => ({
        item: doc,
        refIndex: index,
        score: 1,
        matches: [],
      }));
    }
    return fuse.search(searchTerm);
  }, [searchTerm, docs, fuse]);

  return { searchTerm, setSearchTerm, results };
}