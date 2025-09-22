"use client"

import { useState, useCallback, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Upload, File, X, CheckCircle, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface FileUploadProps {
  onUploadComplete: () => void
  maxFiles?: number
  maxSize?: number
  acceptedTypes?: string[]
  disabled?: boolean
}

interface UploadFile {
  file: File
  id: string
  progress: number
  status: "pending" | "uploading" | "success" | "error"
  error?: string
}

export function FileUpload({
  onUploadComplete,
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024, // 10MB
  disabled = false,
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadFile[]>([])

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles: UploadFile[] = acceptedFiles.map((file) => ({
        file: file,
        id: Math.random().toString(36).substring(7),
        progress: 0,
        status: "pending" as const,
      }))
      setFiles((prev) => [...prev, ...newFiles].slice(-maxFiles))
    },
    [maxFiles],
  )

  useEffect(() => {
    const uploadPendingFiles = async () => {
      const pendingFiles = files.filter((f) => f.status === "pending")
      if (pendingFiles.length > 0) {
        await handleUpload(pendingFiles)
      }
    }
    uploadPendingFiles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "text/plain": [".txt"],
    },
    maxSize,
    maxFiles,
    disabled: disabled,
  })

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== id))
  }

  const handleUpload = async (filesToUpload: UploadFile[]) => {
    setFiles((prev) =>
      prev.map((f) =>
        filesToUpload.find((item) => item.id === f.id)
          ? { ...f, status: "uploading" }
          : f,
      ),
    )

    const formData = new FormData()
    filesToUpload.forEach((uploadFile) => {
      formData.append("files", uploadFile.file)
    })

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Upload failed")
      }

      setFiles((prev) =>
        prev.map((f) =>
          filesToUpload.find((item) => item.id === f.id)
            ? { ...f, status: "success", progress: 100 }
            : f,
        ),
      )
      onUploadComplete()
    } catch (error) {
      setFiles((prev) =>
        prev.map((f) =>
          filesToUpload.find((item) => item.id === f.id)
            ? {
                ...f,
                status: "error",
                error:
                  error instanceof Error ? error.message : "Upload failed",
              }
            : f,
        ),
      )
    }
  }

  const getStatusIcon = (status: UploadFile["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case "uploading":
        return (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        )
      default:
        return <File className="h-4 w-4 text-muted-foreground" />
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25",
              disabled
                ? "cursor-not-allowed opacity-50"
                : "hover:border-primary hover:bg-primary/5",
            )}
          >
            <input {...getInputProps()} />
            <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">
              {isDragActive
                ? "Drop files here"
                : "Drag & drop files here, or click to select"}
            </p>
            <p className="text-sm text-muted-foreground">
              Supports PDF, DOC, DOCX, TXT files up to{" "}
              {Math.round(maxSize / 1024 / 1024)}MB
            </p>
          </div>
        </CardContent>
      </Card>

      {files.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
              <h3 className="font-medium">
                Uploaded Files ({files.filter((f) => f.status === "success").length}/{files.length})
              </h3>
              {files.map((uploadFile) => (
                <div
                  key={uploadFile.id}
                  className="flex items-center space-x-3 p-3 border rounded-lg"
                >
                  {getStatusIcon(uploadFile.status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {uploadFile.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    {uploadFile.status === "uploading" && (
                      <Progress value={uploadFile.progress} className="mt-2 h-1" />
                    )}
                    {uploadFile.status === "error" && uploadFile.error && (
                      <p className="text-xs text-red-500 mt-1">
                        {uploadFile.error}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(uploadFile.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}