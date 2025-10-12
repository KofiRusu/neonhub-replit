"use client";

import { signIn } from "next-auth/react";
import { Github } from "lucide-react";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SignInContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const error = searchParams.get("error");

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0E0F1A] px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="glass-strong p-8 rounded-lg border border-white/10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gradient mb-2">Welcome to NeonHub</h1>
            <p className="text-white/60">Sign in to access your AI command center</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm">
              {error === "OAuthSignin" && "Error connecting to OAuth provider"}
              {error === "OAuthCallback" && "Error during OAuth callback"}
              {error === "OAuthCreateAccount" && "Error creating account"}
              {error === "EmailCreateAccount" && "Error creating email account"}
              {error === "Callback" && "Error in callback"}
              {error === "OAuthAccountNotLinked" && "Account already linked to another provider"}
              {error === "EmailSignin" && "Error sending email"}
              {error === "CredentialsSignin" && "Invalid credentials"}
              {error === "SessionRequired" && "Please sign in to continue"}
              {!error.includes("OAuth") && !error.includes("Email") && !error.includes("Credentials") && "Authentication error occurred"}
            </div>
          )}

          <button
            onClick={() => signIn("github", { callbackUrl })}
            className="w-full btn-neon flex items-center justify-center space-x-3 py-3"
          >
            <Github className="w-5 h-5" />
            <span>Continue with GitHub</span>
          </button>

          <p className="mt-6 text-center text-sm text-white/40">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>

        <div className="mt-4 text-center text-sm text-white/40">
          <p>Demo mode: OAuth may not be configured</p>
          <p className="mt-1">Set GITHUB_ID and GITHUB_SECRET in .env.local</p>
        </div>
      </motion.div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#0E0F1A]">
      <div className="text-white">Loading...</div>
    </div>}>
      <SignInContent />
    </Suspense>
  );
}
