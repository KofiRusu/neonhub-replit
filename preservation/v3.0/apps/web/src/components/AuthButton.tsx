"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { LogIn, LogOut, User } from "lucide-react";
import { motion } from "framer-motion";

export default function AuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 text-white/60">
        <div className="w-2 h-2 bg-white/40 rounded-full animate-pulse"></div>
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  if (session?.user) {
    return (
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 px-3 py-2 glass rounded-lg">
          {session.user.image ? (
            <img
              src={session.user.image}
              alt={session.user.name || "User"}
              className="w-6 h-6 rounded-full"
            />
          ) : (
            <User className="w-4 h-4 text-white/60" />
          )}
          <span className="text-sm text-white/80 hidden md:inline">
            {session.user.name || session.user.email}
          </span>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex items-center space-x-2 px-3 py-2 glass rounded-lg hover:bg-white/10 transition-colors"
          title="Sign out"
        >
          <LogOut className="w-4 h-4 text-white/60" />
          <span className="text-sm text-white/60 hidden md:inline">Sign out</span>
        </motion.button>
      </div>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => signIn("github")}
      className="btn-neon text-sm flex items-center space-x-2"
    >
      <LogIn className="w-4 h-4" />
      <span>Sign in</span>
    </motion.button>
  );
}
