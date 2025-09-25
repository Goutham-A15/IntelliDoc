"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface Heading {
  level: number;
  text: string;
  slug: string;
}

interface TableOfContentsProps {
  content: string;
}

export function TableOfContents({ content }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const headingLines = content.split("\n").filter((line) => line.startsWith("#"));
    const headingsData = headingLines.map((line) => {
      const level = line.match(/^#+/)![0].length;
      const text = line.replace(/^#+\s*/, "");
      const slug = text.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]+/g, "");
      return { level, text, slug };
    });
    setHeadings(headingsData);
  }, [content]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "0% 0% -80% 0%" }
    );

    headings.forEach(({ slug }) => {
      const element = document.getElementById(slug);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      headings.forEach(({ slug }) => {
        const element = document.getElementById(slug);
        if (element) {
          observer.unobserve(element);
        }
      });
    };
  }, [headings]);

  return (
    <div className="sticky top-24">
      <h3 className="font-semibold mb-2">On This Page</h3>
      <ul className="space-y-2">
        {headings.map(({ slug, text, level }) => (
          <li key={slug} style={{ paddingLeft: `${(level - 2) * 1}rem` }}>
            <a
              href={`#${slug}`}
              className={cn(
                "text-sm hover:text-primary",
                activeId === slug ? "text-primary font-semibold" : "text-muted-foreground"
              )}
            >
              {text}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}