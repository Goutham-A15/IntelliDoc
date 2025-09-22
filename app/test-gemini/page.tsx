"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle, AlertTriangle, Loader2 } from "lucide-react";

type TestStatus = "idle" | "loading" | "success" | "error";

export default function TestGeminiPage() {
  const [status, setStatus] = useState<TestStatus>("idle");
  const [result, setResult] = useState<any | null>(null);

  const handleTestClick = async () => {
    setStatus("loading");
    setResult(null);

    try {
      const response = await fetch("/api/test-gemini");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "The server returned an error.");
      }

      setStatus("success");
      setResult(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      setStatus("error");
      setResult({ message: errorMessage });
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Gemini API Key Test</CardTitle>
          <CardDescription>
            Click the button below to send a test request to the Gemini API using your provided key.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleTestClick} disabled={status === "loading"} className="w-full">
            {status === "loading" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              "Run Gemini API Test"
            )}
          </Button>

          {status !== "idle" && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              {status === "success" && (
                <div className="flex items-start gap-4">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-1" />
                  <div>
                    <h3 className="font-semibold text-green-600">Test Successful!</h3>
                    <p className="text-sm text-muted-foreground mt-2">Gemini's Response:</p>
                    <blockquote className="mt-1 border-l-2 pl-4 italic">
                      {result?.response}
                    </blockquote>
                  </div>
                </div>
              )}
              {status === "error" && (
                <div className="flex items-start gap-4">
                  <AlertTriangle className="h-6 w-6 text-red-500 mt-1" />
                  <div>
                    <h3 className="font-semibold text-red-600">Test Failed</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      {result?.message}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}