"use client"

import React, { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { GoogleIcon } from "./googleIcon"
import { Eye, EyeOff } from "lucide-react"

interface LoginFormProps {
  setActiveTab: React.Dispatch<React.SetStateAction<string | undefined>>;
}

export default function LoginForm({ setActiveTab }: LoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [view, setView] = useState<'signIn' | 'forgotPassword'>('signIn');
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      toast({
        title: "Login Successful",
        description: "Welcome back!",
      })
      router.push("/dashboard")
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred."
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }
  
const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });

      if (error) {
        // This will catch actual errors like network issues or rate limiting
        throw error;
      }

      // For security, Supabase doesn't confirm if an email exists.
      // We show a neutral message regardless.
      toast({
        title: "Check your email",
        description: "If an account exists for this email, a password reset link has been sent.",
      });
      setView('signIn');

    } catch (error: any) {
      setError(error.message);
      toast({
        title: "Error",
        description: "Could not send password reset email. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: 'google') => {
    const { error } = await supabase.auth.signInWithOAuth({ provider });
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="bg-white/90 dark:bg-gray-950/90 backdrop-blur-sm border-none shadow-2xl">
      <CardHeader className="text-center space-y-2">
        <CardTitle className="text-3xl font-bold">
          {view === 'signIn' ? 'Smart Doc Checker' : 'Reset Password'}
        </CardTitle>
        <CardDescription>
          {view === 'signIn' ? 'Sign in to analyze your documents' : 'Enter your email to receive a reset link'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {view === 'signIn' ? (
          <form onSubmit={handleLogin}>
            <div className="flex flex-col gap-y-4">
              <div className="grid gap-y-3">
                <div className="grid gap-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="grid gap-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" required value={password} onChange={(e) => setPassword(e.target.value)} />
                    <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <div className="text-right">
                    <button type="button" onClick={() => setView('forgotPassword')} className="text-xs font-medium text-primary underline-offset-4 hover:underline">
                      Forgot Password?
                    </button>
                  </div>
                </div>
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
              <div className="relative my-1">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">OR</span>
                </div>
              </div>
              <Button type="button" variant="google" className="w-full" onClick={() => handleOAuthSignIn('google')}>
                <GoogleIcon className="h-5 w-5 mr-2" />
                Continue with Google
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handlePasswordReset}>
            <div className="flex flex-col gap-y-4">
              <div className="grid gap-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={isLoading}>
                {isLoading ? "Sending..." : "Send Reset Link"}
              </Button>
               <Button variant="outline" type="button" onClick={() => setView('signIn')}>
                Back to Sign In
              </Button>
            </div>
          </form>
        )}
      </CardContent>
      {view === 'signIn' && (
        <CardFooter className="flex justify-center text-sm pt-4">
          <p className="text-muted-foreground">
            Don&apos;t have an account?{" "}
            <button type="button" className="underline font-semibold text-primary" onClick={() => setActiveTab("signup")}>
              Get Started
            </button>
          </p>
        </CardFooter>
      )}
    </Card>
  )
}