"use client"

import React, { useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { GoogleIcon } from "./googleIcon"
import { Eye, EyeOff } from "lucide-react"

interface SignUpFormProps {
  onSignUpSuccess: () => void;
  setActiveTab: React.Dispatch<React.SetStateAction<string | undefined>>;
}

const PasswordStrengthIndicator = ({ strength }: { strength: number }) => {
  const levels = [
    { label: "Weak", color: "bg-red-500" },
    { label: "Fair", color: "bg-orange-500" },
    { label: "Good", color: "bg-yellow-500" },
    { label: "Strong", color: "bg-green-500" },
  ];

  return (
    <div className="flex items-center gap-x-2">
      <div className="grid grid-cols-4 gap-x-1 w-full h-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className={`h-full rounded-sm ${
              strength > index ? levels[index].color : "bg-muted"
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground w-16 text-right">
        {strength > 0 ? levels[strength - 1].label : ""}
      </p>
    </div>
  );
};

export default function SignUpForm({ onSignUpSuccess, setActiveTab }: SignUpFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [apiError, setApiError] = useState<string | null>(null) // For errors from the server
  const [formError, setFormError] = useState<string | null>(null) // For client-side validation errors
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { toast } = useToast()
  const supabase = createClient();

  const passwordStrength = useMemo(() => {
    let strength = 0;
    if (password.length > 5) strength++;
    if (password.length > 7) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return Math.min(Math.floor(strength / 1.25), 4);
  }, [password]);


  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    // Clear previous errors on a new submission attempt
    setFormError(null)
    setApiError(null)
    
    // Client-side validation before trying to submit
    if (password.length < 6) {
      setFormError("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/dashboard`,
          data: {
            full_name: fullName,
          },
        },
      })
      if (error) {
         if (error.message.includes("User already registered")) {
          toast({
            title: "User already exists",
            description: "Please sign in to continue.",
          })
          setActiveTab("login");
        } else {
          throw error
        }
      } else {
        onSignUpSuccess()
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred."
      setApiError(errorMessage)
      toast({
        title: "Signup Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

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
          <CardTitle className="text-3xl font-bold">Create Account</CardTitle>
          <CardDescription>Join to start analyzing documents</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp}>
            <div className="flex flex-col gap-y-4">
               <div className="grid gap-y-3">
                <div className="grid gap-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input id="fullName" type="text" placeholder="John Doe" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
                  </div>
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
                    {password.length > 0 && <PasswordStrengthIndicator strength={passwordStrength} />}
                  </div>
                  <div className="grid gap-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                     <div className="relative">
                      <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                      <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
               </div>
              {(formError || apiError) && <p className="text-sm text-red-500 pt-1">{formError || apiError}</p>}
              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Create Account"}
              </Button>
               <div className="relative my-1">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    OR
                  </span>
                </div>
              </div>
               <Button type="button" variant="google" className="w-full" onClick={() => handleOAuthSignIn('google')}>
                <GoogleIcon className="h-5 w-5 mr-2" />
                Continue with Google
              </Button>
            </div>
          </form>
        </CardContent>
         <CardFooter className="flex justify-center text-sm pt-4">
            <p className="text-muted-foreground">
              Already have an account?{" "}
              <button type="button" className="underline font-semibold text-primary" onClick={() => setActiveTab("login")}>
                Sign In
              </button>
            </p>
      </CardFooter>
      </Card>
  )
}