"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AuthForm } from "./AuthForm";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "login" | "signup";
  onSignUpSuccess: () => void;
}

export function AuthModal({ isOpen, onClose, initialTab, onSignUpSuccess }: AuthModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <AuthForm initialTab={initialTab} onSignUpSuccess={onSignUpSuccess} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}