"use client";

import { Button } from "@/components/ui/button";
import { Clipboard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CodeBlockProps {
  language: string;
  value: string;
}

export function CodeBlock({ language, value }: CodeBlockProps) {
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    toast({
      title: "Copied to clipboard!",
    });
  };

  return (
    <div className="relative my-4 rounded-md bg-gray-800 text-white font-mono">
      <div className="flex justify-between items-center px-4 py-2 border-b border-gray-700">
        <span className="text-xs font-semibold uppercase">{language}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-gray-300 hover:text-white hover:bg-gray-700"
          onClick={handleCopy}
        >
          <Clipboard className="h-4 w-4" />
        </Button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm">
        <code>{value}</code>
      </pre>
    </div>
  );
}