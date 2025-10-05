"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import AgentActionPicker from "./AgentActionPicker"
import SourceCitations from "./SourceCitations"
import { useCopilotRouter } from "@/hooks/useCopilotRouter"
import { Send, Loader2, Sparkles, ChevronDown, ChevronUp, Copy, ThumbsUp, ThumbsDown } from "lucide-react"

interface Message {
  id: string
  type: "user" | "assistant"
  content: string
  timestamp: Date
  sources?: Array<{ title: string; url: string; updatedAt: string }>
  predictedIntent?: string
  reasoning?: string
}

interface BrandVoiceCopilotProps {
  onIntent?: (intent: string, payload: any) => Promise<any>
  sources?: Array<{ title: string; url: string; updatedAt: string }>
}

export default function BrandVoiceCopilot({ onIntent, sources }: BrandVoiceCopilotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      type: "assistant",
      content:
        "Hi! I'm your Brand Voice Copilot. I can help you generate content, analyze campaigns, run SEO audits, and coordinate across all your marketing agents. Try typing `/` to see available commands or just ask me anything!",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showActionPicker, setShowActionPicker] = useState(false)
  const [predictedIntent, setPredictedIntent] = useState<string | null>(null)
  const [expandedReasoning, setExpandedReasoning] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { executeIntent, getAvailableIntents } = useCopilotRouter()

  const availableIntents = getAvailableIntents()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      // Simulate intent prediction
      const intentMatch = input.match(/^\/(\w+)/)
      const predictedIntent = intentMatch ? intentMatch[1] : null

      if (predictedIntent && availableIntents.some((i) => i.command === predictedIntent)) {
        setPredictedIntent(predictedIntent)
        setShowActionPicker(true)
      }

      // Simulate AI response
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: predictedIntent
          ? `I can help you with that! I've detected you want to run a ${predictedIntent} action. Would you like me to proceed?`
          : `I understand you're asking about "${input}". Based on your brand voice guidelines, here's what I recommend...`,
        timestamp: new Date(),
        sources: sources || [
          { title: "Brand Guidelines v2.1", url: "/docs/brand-guidelines", updatedAt: "2024-01-15" },
          { title: "Tone & Voice Playbook", url: "/docs/tone-voice", updatedAt: "2024-01-10" },
        ],
        predictedIntent,
        reasoning:
          "I analyzed your request against brand guidelines and recent campaign performance data to provide this recommendation.",
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error processing message:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleIntentConfirm = async (intent: string, payload: any) => {
    setShowActionPicker(false)
    setIsLoading(true)

    try {
      const result = await executeIntent(intent, payload)

      const resultMessage: Message = {
        id: Date.now().toString(),
        type: "assistant",
        content: `✅ Successfully executed ${intent}! ${result.summary || "Action completed."}`,
        timestamp: new Date(),
        sources: result.sources,
      }

      setMessages((prev) => [...prev, resultMessage])
    } catch (error) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        type: "assistant",
        content: `❌ Failed to execute ${intent}. ${error instanceof Error ? error.message : "Unknown error occurred."}`,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      setPredictedIntent(null)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-300px)]">
      {/* Chat Interface */}
      <div className="lg:col-span-2 flex flex-col">
        <Card className="flex-1 bg-[#1A1B23]/50 border-white/10 backdrop-blur-xl">
          <div className="flex flex-col h-full">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] ${
                        message.type === "user"
                          ? "bg-gradient-to-r from-[#00D4FF] to-[#B084FF] text-white"
                          : "bg-[#2A2B35]/50 border border-white/10 text-gray-100"
                      } rounded-lg p-4`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {message.type === "assistant" && <Sparkles className="w-4 h-4 text-[#00D4FF]" />}
                          <span className="text-xs text-gray-400">{message.timestamp.toLocaleTimeString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <Copy className="w-3 h-3" />
                          </Button>
                          {message.type === "assistant" && (
                            <>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <ThumbsUp className="w-3 h-3" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <ThumbsDown className="w-3 h-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>

                      <p className="text-sm leading-relaxed">{message.content}</p>

                      {message.sources && (
                        <div className="mt-3">
                          <SourceCitations sources={message.sources} />
                        </div>
                      )}

                      {message.reasoning && (
                        <div className="mt-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedReasoning(expandedReasoning === message.id ? null : message.id)}
                            className="text-xs text-gray-400 hover:text-gray-300"
                          >
                            {expandedReasoning === message.id ? (
                              <>
                                <ChevronUp className="w-3 h-3 mr-1" />
                                Hide reasoning
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-3 h-3 mr-1" />
                                Show reasoning
                              </>
                            )}
                          </Button>

                          <AnimatePresence>
                            {expandedReasoning === message.id && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-2 p-3 bg-[#0A0A0F]/50 rounded border border-white/5"
                              >
                                <p className="text-xs text-gray-400">{message.reasoning}</p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="bg-[#2A2B35]/50 border border-white/10 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin text-[#00D4FF]" />
                      <span className="text-sm text-gray-400">Thinking...</span>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-white/10 p-4">
              <div className="flex space-x-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything or type / for commands..."
                  className="flex-1 bg-[#2A2B35]/50 border-white/10 text-white placeholder-gray-400"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="bg-gradient-to-r from-[#00D4FF] to-[#B084FF] hover:from-[#00D4FF]/80 hover:to-[#B084FF]/80"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Action Drawer */}
      <div className="space-y-6">
        <AnimatePresence>
          {showActionPicker && predictedIntent && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <AgentActionPicker
                predictedIntent={predictedIntent}
                onConfirm={handleIntentConfirm}
                onCancel={() => {
                  setShowActionPicker(false)
                  setPredictedIntent(null)
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Available Commands */}
        <Card className="bg-[#1A1B23]/50 border-white/10 backdrop-blur-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Available Commands</h3>
          <div className="space-y-2">
            {availableIntents.slice(0, 6).map((intent) => (
              <div
                key={intent.command}
                className="flex items-center justify-between p-2 rounded bg-[#2A2B35]/30 hover:bg-[#2A2B35]/50 transition-colors cursor-pointer"
                onClick={() => setInput(`/${intent.command} `)}
              >
                <div>
                  <div className="text-xs font-medium text-[#00D4FF]">/{intent.command}</div>
                  <div className="text-xs text-gray-400">{intent.description}</div>
                </div>
                <div
                  className={`w-2 h-2 rounded-full ${intent.status === "active" ? "bg-[#00FF88]" : "bg-gray-500"}`}
                />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
