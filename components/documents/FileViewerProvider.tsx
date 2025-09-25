"use client";

import { createContext, useContext, useState, ReactNode } from 'react';
import type { Document } from '@/lib/types/database';
import { FileViewer } from './file-viewer';

interface FileViewerContextType {
  showFile: (document: Document) => void;
}

const FileViewerContext = createContext<FileViewerContextType | undefined>(undefined);

export function useFileViewer() {
  const context = useContext(FileViewerContext);
  if (!context) {
    throw new Error('useFileViewer must be used within a FileViewerProvider');
  }
  return context;
}

export function FileViewerProvider({ children }: { children: ReactNode }) {
  const [activeDocument, setActiveDocument] = useState<Document | null>(null);

  const showFile = (document: Document) => {
    setActiveDocument(document);
  };

  const handleClose = () => {
    setActiveDocument(null);
  };

  return (
    <FileViewerContext.Provider value={{ showFile }}>
      {children}
      {/* The FileViewer is now rendered here, controlled by global state */}
      <FileViewer document={activeDocument} onClose={handleClose} />
    </FileViewerContext.Provider>
  );
}

