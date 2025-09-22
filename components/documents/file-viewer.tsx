"use client"

import { useState, useEffect } from "react"
import { Document } from "@/lib/types/database"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X } from "lucide-react"

interface FileViewerProps {
  document: Document | null
  onClose: () => void
}

export function FileViewer({ document, onClose }: FileViewerProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!document) return

    const fetchSignedUrl = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch("/api/documents/view", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ storagePath: document.storage_path }),
        })

        if (!response.ok) throw new Error("Failed to get file URL")
        const data = await response.json()
        setSignedUrl(data.signedUrl)

      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchSignedUrl()
  }, [document])

  if (!document) return null

  const renderFile = () => {
    if (loading) {
      return <div className="flex justify-center items-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
    }
    if (error) {
      return <p className="text-red-500 text-center">{error}</p>
    }
    if (!signedUrl) {
      return <p className="text-center">Could not load file.</p>
    }
    switch (document.file_type) {
      case "application/pdf":
        return <iframe src={signedUrl} className="w-full h-full" title={document.filename} />
      case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      case "application/msword":
        return <iframe src={`https://docs.google.com/gview?url=${encodeURIComponent(signedUrl)}&embedded=true`} className="w-full h-full" title={document.filename} />
      default:
        // For text files and others, provide a download link as iframe might not work
        return <div className="p-8 text-center"><p>Preview not available for this file type.</p><a href={signedUrl} download target="_blank" rel="noopener noreferrer"><Button className="mt-4">Download File</Button></a></div>
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl h-[90vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{document.filename}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
        </CardHeader>
        <CardContent className="flex-1 p-0 overflow-hidden">
          {renderFile()}
        </CardContent>
      </Card>
    </div>
  )
}