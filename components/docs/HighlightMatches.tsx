"use client";

import { useMemo } from "react";
import type { RangeTuple } from "fuse.js";

interface HighlightMatchesProps {
  value: string;
  indices: readonly RangeTuple[];
}

export function HighlightMatches({ value, indices }: HighlightMatchesProps) {
  const parts = useMemo(() => {
    const highlightParts: { text: string; highlight: boolean }[] = [];
    let lastIndex = 0;

    indices.forEach(([start, end]) => {
      if (lastIndex < start) {
        highlightParts.push({
          text: value.substring(lastIndex, start),
          highlight: false,
        });
      }
      highlightParts.push({
        text: value.substring(start, end + 1),
        highlight: true,
      });
      lastIndex = end + 1;
    });

    if (lastIndex < value.length) {
      highlightParts.push({
        text: value.substring(lastIndex),
        highlight: false,
      });
    }

    return highlightParts;
  }, [value, indices]);

  return (
    <>
      {parts.map((part, index) =>
        part.highlight ? (
          <span key={index} className="bg-yellow-200 dark:bg-yellow-700 text-foreground rounded">
            {part.text}
          </span>
        ) : (
          <span key={index}>{part.text}</span>
        )
      )}
    </>
  );
}