"use client";

import { useState } from "react";
import LoginForm from "./LoginForm";
import SignUpForm from "./SignupForm";

interface AuthFormProps {
    initialTab?: "login" | "signup";
    onSignUpSuccess: () => void;
}

export function AuthForm({ initialTab = "login", onSignUpSuccess }: AuthFormProps) {
  const [activeTab, setActiveTab] = useState<string | undefined>(initialTab);

  return (
    <div>
      {activeTab === "login" ? (
        <LoginForm setActiveTab={setActiveTab} />
      ) : (
        <SignUpForm onSignUpSuccess={onSignUpSuccess} setActiveTab={setActiveTab} />
      )}
    </div>
  );
}