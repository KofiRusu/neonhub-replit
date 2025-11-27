"use client"

import { motion } from "framer-motion"
import { Sparkles, Clock, Zap } from "lucide-react"

interface ComingSoonProps {
  feature: string
  description?: string
}

export default function ComingSoon({ feature, description }: ComingSoonProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 border-2 border-slate-700/50 backdrop-blur-sm shadow-xl p-12 text-center max-w-2xl mx-auto"
      >
        <motion.div
          animate={{
            rotate: [0, 360],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 3,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
          className="mb-8 flex justify-center"
        >
          <div className="relative">
            <Sparkles className="w-16 h-16 text-neon-blue" />
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
              className="absolute inset-0"
            >
              <Zap className="w-16 h-16 text-neon-purple" />
            </motion.div>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-4xl font-bold mb-4 text-gradient"
        >
          {feature}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-xl text-gray-300 mb-8"
        >
          {description || "This feature is currently being integrated. Stay tuned for updates!"}
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex items-center justify-center gap-3 text-neon-blue"
        >
          <Clock className="w-5 h-5" />
          <span className="text-sm font-medium">Coming Soon</span>
        </motion.div>

        <motion.div
          animate={{
            boxShadow: [
              "0 0 20px rgba(0, 255, 255, 0.3)",
              "0 0 40px rgba(122, 95, 255, 0.4)",
              "0 0 20px rgba(0, 255, 255, 0.3)",
            ],
          }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          className="mt-8 h-1 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 rounded-full"
        />
      </motion.div>
    </div>
  )
}
