import { notFound } from "next/navigation";
import { getAllDocs, getDocBySlug } from "@/lib/docs";
import { DocPageClient } from "./DocPageClient"; // Import the new client component

interface DocPageProps {
  params: {
    slug: string;
  };
}

export async function generateStaticParams() {
  const docs = getAllDocs();
  return docs.map((doc) => ({
    slug: doc.slug,
  }));
}

export default function DocPage({ params }: DocPageProps) {
  const doc = getDocBySlug(params.slug);

  if (!doc) {
    notFound();
  }

  // Render the client component and pass the doc data as a prop
  return <DocPageClient doc={doc} />;
}