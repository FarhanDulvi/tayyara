"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Loader2, Plus } from "lucide-react"
import { mockChatMessages, suggestedPrompts } from "@/lib/mock-data"
import type { ChatMessage } from "@/lib/mock-data"
import { useLanguage } from "@/components/language-provider"

export function ResearchChat() {
  const { language, t } = useLanguage()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [reasoning, setReasoning] = useState<ChatMessage["reasoning"] | null>(null)

  const isRTL = language === "ar"

  // Detect if a string contains Arabic characters → render in RTL bubble
  const containsArabic = (text: string) => /[\u0600-\u06FF]/.test(text)

  const handleSubmit = (text?: string) => {
    const messageText = text || input.trim()
    if (!messageText || isProcessing) return

    setInput("")
    const userMessage: ChatMessage = { role: "user", content: messageText }
    setMessages((m) => [...m, userMessage])
    setIsProcessing(true)

    // Simulate agent reasoning
    const steps = [
      language === "ar"
        ? "جمع البيانات من 3 شركات طيران..."
        : "Gathering data from 3 airlines...",
      language === "ar" ? "تحليل 12 تركيبة تاريخ..." : "Analyzing 12 date combinations...",
      language === "ar"
        ? "البحث عن الانقسامات وأنماط الفتح الفم..."
        : "Finding splits and open-jaw patterns...",
      language === "ar" ? "حساب الأسعار النهائية..." : "Calculating final prices...",
      language === "ar"
        ? "ترتيب النتائج وتحديد فرص التحكيم"
        : "Ranking results and identifying arbitrage opportunities",
    ]

    let currentStep = 1
    const interval = setInterval(() => {
      if (currentStep <= 5) {
        setReasoning({
          currentStep,
          totalSteps: 5,
          stepDescription: steps[currentStep - 1],
        })
        currentStep++
      } else {
        clearInterval(interval)
        setReasoning(null)
        setIsProcessing(false)
        setMessages((m) => [...m, mockChatMessages[1]]) // mock response
      }
    }, 900)
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border/60 px-5 py-4">
        <h2 className="text-base font-semibold text-foreground">{t("chatTitle")}</h2>
      </div>

      {/* Messages area */}
      <ScrollArea className="flex-1 px-5 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 pb-12">
            <div className="text-center">
              <p className="mb-6 text-sm text-muted-foreground">{t("chatPlaceholder")}</p>
              <div className="flex flex-col gap-2">
                {suggestedPrompts.map((prompt, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSubmit(prompt.text)}
                    className="rounded-xl border border-border/60 bg-card px-4 py-2.5 text-start text-xs leading-relaxed text-foreground transition-colors hover:border-accent/30 hover:bg-muted/30"
                    dir={prompt.lang === "ar" ? "rtl" : "ltr"}
                    style={
                      prompt.lang === "ar"
                        ? { fontFamily: "var(--font-arabic)" }
                        : undefined
                    }
                  >
                    {prompt.text}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : ""}`}
              >
                {msg.role === "user" ? (
                  <div
                    className="max-w-[85%] rounded-2xl rounded-ee-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground"
                    dir={containsArabic(msg.content) ? "rtl" : "ltr"}
                    style={
                      containsArabic(msg.content)
                        ? { fontFamily: "var(--font-arabic)" }
                        : undefined
                    }
                  >
                    {msg.content}
                  </div>
                ) : (
                  <div className="w-full space-y-3">
                    <div className="rounded-2xl border border-border/60 bg-muted/30 px-4 py-3 text-sm text-foreground leading-relaxed">
                      {msg.content}
                    </div>

                    {msg.options && (
                      <div className="space-y-2">
                        {msg.options.map((opt) => (
                          <Card
                            key={opt.rank}
                            className="gap-0 rounded-xl border-border/60 p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <Badge className="h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary hover:bg-primary/10">
                                  {opt.rank}
                                </Badge>
                                <span className="text-sm font-semibold text-foreground">
                                  {opt.route}
                                </span>
                              </div>
                              <div className="flex flex-col items-end">
                                <span className="text-lg font-semibold tabular-nums text-accent">
                                  {new Intl.NumberFormat(isRTL ? "ar-SA" : "en-US").format(
                                    opt.price
                                  )}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {t("sar")}
                                </span>
                              </div>
                            </div>

                            <div className="mt-2 text-xs text-muted-foreground">
                              {opt.airline}
                            </div>

                            <ul className="mt-3 space-y-1">
                              {opt.details.map((detail, idx) => (
                                <li
                                  key={idx}
                                  className="flex items-start gap-2 text-xs text-muted-foreground"
                                >
                                  <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-accent" />
                                  <span className="leading-relaxed">{detail}</span>
                                </li>
                              ))}
                            </ul>

                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-3 w-full gap-2 rounded-full border-accent/30 text-accent hover:bg-accent/10 hover:text-accent"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              {t("addToWatch")}
                            </Button>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Reasoning bar (show when processing) */}
      {isProcessing && reasoning && (
        <div className="border-t border-border/40 bg-muted/30 px-5 py-2.5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
            <span>
              {language === "ar"
                ? `الخطوة ${reasoning.currentStep} من ${reasoning.totalSteps}: ${reasoning.stepDescription}`
                : `Step ${reasoning.currentStep} of ${reasoning.totalSteps}: ${reasoning.stepDescription}`}
            </span>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border/60 px-5 py-4">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSubmit()
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("chatPlaceholder")}
            disabled={isProcessing}
            className="flex-1 rounded-full border border-input bg-background px-4 py-2 text-sm outline-none ring-ring ring-offset-background transition-shadow placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
            dir={isRTL ? "rtl" : "ltr"}
          />
          <Button
            type="submit"
            size="icon"
            disabled={isProcessing || !input.trim()}
            className="h-9 w-9 shrink-0 rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
