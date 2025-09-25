import { getAllDocs, Doc } from "@/lib/docs";
import { DocsSearch } from "./DocsSearch";

export default function DocsIndexPage() {
  const allDocs = getAllDocs();

  const sections = allDocs.reduce((acc, doc) => {
    (acc[doc.section] = acc[doc.section] || []).push(doc);
    return acc;
  }, {} as Record<string, Doc[]>);

  return (
    <div className="container mx-auto max-w-5xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 tracking-tight">Documentation</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Welcome to the Smart Doc Checker knowledge base. Find guides, tutorials, and answers to your questions.
        </p>
      </div>

      <DocsSearch allDocs={allDocs} sections={sections} />
    </div>
  );
}