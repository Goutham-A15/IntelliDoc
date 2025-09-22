import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { HelpCircle } from "lucide-react"

export default function HelpPage() {
  const faqs = [
    {
      question: "What types of documents can I upload?",
      answer: "You can upload PDF, DOC, DOCX, and TXT files. The maximum file size is 10MB per document.",
    },
    {
      question: "How does the AI analysis work?",
      answer: "Our app uses advanced AI models to read and understand your documents, identifying contradictions, inconsistencies, and other potential issues. The AI looks for conflicting statements, factual errors, and logical fallacies.",
    },
    {
      question: "Is my data secure?",
      answer: "Yes, your data is secure. Documents are encrypted and are not stored permanently on our servers after analysis. We are committed to protecting your privacy.",
    },
    {
      question: "How do I upgrade my plan?",
      answer: "You can upgrade your plan from the 'Billing' section in your dashboard. Simply choose the plan that best fits your needs and follow the on-screen instructions.",
    },
    {
      question: "What should I do if an analysis fails?",
      answer: "If an analysis fails, please try re-uploading the document. If the issue persists, contact our support team for assistance. This may happen with heavily formatted or scanned documents.",
    },
  ]

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Help Center</h1>
        <p className="text-muted-foreground">Find answers to common questions about Smart Doc Checker.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Frequently Asked Questions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  )
}