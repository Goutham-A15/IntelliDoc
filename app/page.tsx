"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Zap, Shield, BarChart3, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { AuthModal } from "@/components/auth/AuthModal";

// Feature data for the marquee
const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Analyze documents in seconds using Gemini-1.5 Flash AI technology.",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Your documents are encrypted and never stored permanently.",
  },
  {
    icon: BarChart3,
    title: "Detailed Reports",
    description: "Get comprehensive analysis reports with highlighted contradictions.",
  },
  {
    icon: FileText,
    title: "Multiple Formats",
    description: "Support for PDF, Word, and text documents.",
  },
];

export default function HomePage() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [initialAuthTab, setInitialAuthTab] = useState<"login" | "signup">("login");
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);

  const openAuthModal = (tab: "login" | "signup") => {
    setInitialAuthTab(tab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const handleSignUpSuccess = () => {
    setIsAuthModalOpen(false);
    setShowVerificationMessage(true);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950">
      <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} initialTab={initialAuthTab} onSignUpSuccess={handleSignUpSuccess} />

      {/* Verification Message Popup */}
      {showVerificationMessage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
          onClick={() => setShowVerificationMessage(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <Card>
              <CardHeader className="text-center">
                <Mail className="h-12 w-12 mx-auto text-green-500" />
                <CardTitle className="text-2xl">Check your email</CardTitle>
                <CardDescription>We've sent you a verification link</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Please check your email and click the verification link to activate your Smart Doc Checker account.
                </p>
                <Button onClick={() => setShowVerificationMessage(false)}>Close</Button>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 transition-all duration-300 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-8 w-8 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Smart Doc Checker</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => openAuthModal("login")}>Sign In</Button>
            <Button onClick={() => openAuthModal("signup")} className="bg-indigo-600 hover:bg-indigo-700">Get Started</Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section
          className="relative flex items-center justify-center pt-32 pb-20 md:pt-40 md:pb-24 text-white"
          style={{
            backgroundImage: `url(/bg.png)`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-black/50" />
          <div className="container relative z-10 mx-auto px-4 text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-4xl md:text-6xl font-extrabold mb-6"
            >
              AI-Powered Document Analysis
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-lg md:text-xl text-gray-200 mb-8 max-w-3xl mx-auto"
            >
              Detect contradictions, inconsistencies, and errors in your documents using advanced AI technology. Get detailed reports and insights in seconds.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button size="lg" onClick={() => openAuthModal("signup")} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg">Start Free Trial</Button>
              <Button variant="outline" size="lg" onClick={() => openAuthModal("login")} className="bg-white/10 border-white text-white backdrop-blur-sm hover:bg-white hover:text-indigo-600 transition-colors duration-300">Sign In</Button>
            </motion.div>
          </div>
        </section>

        {/* Features Section with Marquee */}
        <section className="py-20 px-4 bg-gray-50 dark:bg-gray-900 overflow-hidden">
          <div className="container mx-auto text-center">
            <h2 className="text-3xl font-bold mb-12 text-gray-800 dark:text-white">Why Choose Smart Doc Checker?</h2>
            <div className="relative">
              <div className="flex w-max animate-marquee [--duration:30s] hover:[animation-play-state:paused]">
                {[...features, ...features].map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <Card key={index} className="mx-4 w-72 flex-shrink-0 bg-white dark:bg-gray-800 hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
                      <CardHeader>
                        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg inline-block mb-4">
                           <Icon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <CardTitle className="text-gray-800 dark:text-white">{feature.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription>{feature.description}</CardDescription>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 px-4 bg-white dark:bg-gray-950">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Smart Doc Checker. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}