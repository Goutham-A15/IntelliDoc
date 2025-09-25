import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileWarning } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex w-full items-center justify-center p-6 md:p-10">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <FileWarning className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Documentation Not Found</CardTitle>
          <CardDescription>
            The page you are looking for does not exist.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-6">
            The documentation may have been moved or deleted. Please use the button below to return to the main documentation page.
          </p>
          <Button asChild>
            <Link href="/docs">Back to Documentation</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}