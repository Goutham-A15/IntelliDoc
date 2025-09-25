"use client";

import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import type { Doc } from "@/lib/docs";
import { useDocsSearch } from "@/hooks/useDocsSearch";
import { HighlightMatches } from "@/components/docs/HighlightMatches";
// FIX: Import only the specific match type
import type { FuseResultMatch } from "fuse.js";

interface DocsSearchProps {
    allDocs: Doc[];
    sections: Record<string, Doc[]>;
}

export function DocsSearch({ allDocs }: DocsSearchProps) {
    const { searchTerm, setSearchTerm, results } = useDocsSearch(allDocs);

    const getMatch = (matches: readonly FuseResultMatch[] | undefined, key: 'title' | 'excerpt') => {
        if (!matches) return undefined;
        return matches.find((match) => match.key === key);
    }

    return (
        <>
            <div className="relative mb-12 max-w-lg mx-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                type="search"
                placeholder="Search documentation..."
                className="pl-10 h-11"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {results.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                    {results.map(({ item, matches }) => {
                        const titleMatch = getMatch(matches, 'title');
                        const excerptMatch = getMatch(matches, 'excerpt');

                        return (
                            <Link href={`/docs/${item.slug}`} key={item.slug} className="block">
                            <Card className="h-full hover:border-primary hover:shadow-md transition-all">
                                <CardHeader>
                                <CardTitle className="text-lg">
                                    {titleMatch ? <HighlightMatches value={item.title} indices={titleMatch.indices} /> : item.title}
                                </CardTitle>
                                <CardDescription className="mt-2">
                                    {excerptMatch ? <HighlightMatches value={item.excerpt} indices={excerptMatch.indices} /> : item.excerpt}
                                </CardDescription>
                                </CardHeader>
                            </Card>
                            </Link>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">No results found for "{searchTerm}". Try another keyword.</p>
                </div>
            )}
        </>
    )
}