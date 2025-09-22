"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function TestStoragePage() {
  const [storagePath, setStoragePath] = useState("");
  const [fileType, setFileType] = useState("application/pdf");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleTestFile = async () => {
    if (!storagePath) {
      setResult("Error: Please provide a storage path.");
      console.error("Error: Please provide a storage path.");
      return;
    }

    setIsLoading(true);
    setResult(null);
    console.log(`--- Starting Test for: ${storagePath} ---`);

    try {
      const supabase = createClient();

      // 1. Generate a signed URL for the file
      console.log("Step 1: Generating signed URL...");
      const { data, error: urlError } = await supabase.storage
        .from("documents") // Make sure 'documents' is your bucket name
        .createSignedUrl(storagePath, 60); // URL is valid for 60 seconds

      if (urlError) {
        throw new Error(`Supabase URL Error: ${urlError.message}`);
      }

      const signedUrl = data.signedUrl;
      console.log("Step 2: Signed URL generated successfully.");
      // console.log("URL:", signedUrl); // Uncomment to see the full URL

      // 2. Try to fetch the file using the signed URL
      console.log("Step 3: Fetching file from URL...");
      const response = await fetch(signedUrl);

      // 3. Check if the fetch was successful
      if (!response.ok) {
        throw new Error(`Fetch Error: File not accessible. Status: ${response.status} ${response.statusText}`);
      }

      console.log(`Step 4: Fetch successful! Status: ${response.status}`);

      // 4. Process the file based on its type
      if (fileType === "text/plain") {
        console.log("Step 5: Processing TXT file...");
        const textContent = await response.text();
        const words = textContent.split(/\s+/);
        const preview = words.slice(0, 50).join(" ");
        const resultText = `✅ TXT file is accessible.\n\nPreview (first 50 words):\n"${preview}..."`;
        setResult(resultText);
        console.log(resultText);
      } else {
        console.log(`Step 5: Processing ${fileType} file...`);
        const resultText = `✅ File is reachable!\n\nFile Type: ${fileType}\nStatus: ${response.status}`;
        setResult(resultText);
        console.log(resultText);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      setResult(`❌ Test Failed: ${errorMessage}`);
      console.error(`❌ Test Failed:`, error);
    } finally {
      setIsLoading(false);
      console.log("--- Test Finished ---");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Supabase Storage Accessibility Test</CardTitle>
          <CardDescription>
            Enter the storage path and type of a file to check if it's accessible.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="storage-path">Storage Path</Label>
            <Input
              id="storage-path"
              placeholder="e.g., your-user-id/filename.pdf"
              value={storagePath}
              onChange={(e) => setStoragePath(e.target.value)}
            />
             <p className="text-xs text-muted-foreground">
              Find this in your Supabase Storage bucket.
            </p>
          </div>

          <div className="space-y-2">
             <Label htmlFor="file-type">File Type</Label>
              <Select value={fileType} onValueChange={setFileType}>
                <SelectTrigger id="file-type">
                    <SelectValue placeholder="Select a file type" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="application/pdf">PDF</SelectItem>
                    <SelectItem value="application/vnd.openxmlformats-officedocument.wordprocessingml.document">DOCX</SelectItem>
                    <SelectItem value="text/plain">TXT</SelectItem>
                </SelectContent>
              </Select>
          </div>

          <Button onClick={handleTestFile} disabled={isLoading} className="w-full">
            {isLoading ? "Testing..." : "Run Test"}
          </Button>

          {result && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Test Result:</h3>
              <pre className="text-sm whitespace-pre-wrap">{result}</pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
