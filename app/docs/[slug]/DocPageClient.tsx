"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Pencil } from "lucide-react";
import type { Doc } from "@/lib/docs";
import { DocsRenderer } from "@/components/docs/DocsRenderer";
import { TableOfContents } from "@/components/docs/TableOfContents";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface DocPageClientProps {
  doc: Doc;
}

export function DocPageClient({ doc }: DocPageClientProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto max-w-6xl"
    >
      <div className="lg:grid lg:grid-cols-[1fr_240px] lg:gap-12">
        <div className="min-w-0">
          <div className="mb-8 space-y-1">
            <p className="text-sm font-medium text-primary">{doc.section}</p>
            <h1 className="text-4xl font-bold tracking-tight">{doc.title}</h1>
            <p className="text-lg text-muted-foreground">{doc.excerpt}</p>
          </div>
          <Card className="p-6 md:p-8">
            <DocsRenderer content={doc.content} />
          </Card>
          <div className="mt-8">
            <Button variant="outline" asChild>
              <Link href={`https://github.com/your-github-username/your-repo-name/edit/main/content/docs/${doc.slug}.md`} target="_blank">
                <Pencil className="h-4 w-4 mr-2" />
                Edit this page on GitHub
              </Link>
            </Button>
          </div>
        </div>
        <div className="hidden lg:block">
          <TableOfContents content={doc.content} />
        </div>
      </div>
    </motion.div>
  );
}