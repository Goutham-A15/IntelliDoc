// NodeTest/components/layout/GlobalSearch.tsx
"use client";

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { FileText, BookOpen, Search } from 'lucide-react';
import { Command as CommandPrimitive } from 'cmdk';

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useGlobalSearch, SearchableItem } from '@/hooks/useGlobalSearch';
import { useFileViewer } from '@/components/documents/FileViewerProvider';
import type { Doc } from '@/lib/docs';
import type { Document } from '@/lib/types/database';
import { cn } from '@/lib/utils';

export function GlobalSearch() {
  const [isOpen, setIsOpen] = React.useState(false);
  const router = useRouter();
  const { results, searchTerm, setSearchTerm } = useGlobalSearch();
  const { showFile } = useFileViewer();
  const commandRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Handle keyboard shortcut (⌘K or Ctrl+K) to focus the search bar
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Handle closing the dropdown when clicking outside of it
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (commandRef.current && !commandRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle selecting an item from the search results
  const handleSelect = (item: SearchableItem) => {
    setIsOpen(false);
    setSearchTerm(''); // Clear search term after selection
    if (item.type === 'doc') {
      router.push(`/docs/${(item.data as Doc).slug}`);
    } else {
      showFile(item.data as Document);
    }
  };

  return (
    <div className="relative w-full md:w-[200px] lg:w-[336px]" ref={commandRef}>
      <Command className="overflow-visible">
        <div className="relative flex items-center">
          <Search className="absolute left-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <CommandPrimitive.Input
            ref={inputRef}
            value={searchTerm}
            onValueChange={setSearchTerm}
            onFocus={() => setIsOpen(true)}
            placeholder="Search..."
            className={cn(
              'flex h-9 w-full rounded-md border border-input bg-transparent py-2 pl-8 pr-20 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50',
              'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]'
            )}
          />
          <div className="absolute top-1/2 right-2 -translate-y-1/2 rounded-sm bg-muted px-1.5 py-0.5 text-xs text-muted-foreground pointer-events-none">
            ⌘K
          </div>
        </div>
        
        {isOpen && searchTerm.length > 0 && (
          <div 
            className="absolute top-full mt-2 w-full rounded-md border bg-popover text-popover-foreground shadow-md z-50"
            // Prevent blur when clicking inside the list
            onMouseDown={(e) => e.preventDefault()}
          >
            <CommandList>
              {results.length > 0 ? (
                  <>
                  {results.some(r => r.item.type === 'document') && (
                      <CommandGroup heading="My Documents">
                      {results
                          .filter(r => r.item.type === 'document')
                          .map(({ item }) => (
                          <CommandItem
                              key={(item.data as Document).id}
                              onSelect={() => handleSelect(item)}
                              value={(item.data as Document).filename}
                          >
                              <FileText className="mr-2 h-4 w-4" />
                              <span>{(item.data as Document).filename}</span>
                          </CommandItem>
                          ))}
                      </CommandGroup>
                  )}
                  {results.some(r => r.item.type === 'doc') && (
                      <CommandGroup heading="Documentation">
                      {results
                          .filter(r => r.item.type === 'doc')
                          .map(({ item }) => (
                          <CommandItem
                              key={(item.data as Doc).slug}
                              onSelect={() => handleSelect(item)}
                              value={(item.data as Doc).title}
                          >
                              <BookOpen className="mr-2 h-4 w-4" />
                              <span>{(item.data as Doc).title}</span>
                          </CommandItem>
                          ))}
                      </CommandGroup>
                  )}
                  </>
              ) : (
                  <CommandEmpty>No results found.</CommandEmpty>
              )}
            </CommandList>
          </div>
        )}
      </Command>
    </div>
  );
}