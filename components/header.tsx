"use client"

import { useLanguage } from "@/components/language-provider"
import { Plane, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"

export function Header() {
  const { language, setLanguage, t } = useLanguage()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [minutesAgo, setMinutesAgo] = useState(4)

  useEffect(() => {
    const interval = setInterval(() => {
      setMinutesAgo((m) => m + 1)
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      setIsRefreshing(false)
      setMinutesAgo(0)
    }, 1200)
  }

  const lastSyncText =
    language === "ar"
      ? `آخر تحديث: قبل ${minutesAgo === 0 ? "لحظة" : `${minutesAgo} د`}`
      : `Last sync: ${minutesAgo === 0 ? "just now" : `${minutesAgo} min ago`}`

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Plane className="h-5 w-5 -rotate-45" strokeWidth={2.2} />
          </div>
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-semibold tracking-tight text-foreground">
                Tayyara
              </span>
              <span className="text-muted-foreground/40">·</span>
              <span
                className="text-lg font-medium tracking-tight text-foreground"
                style={{ fontFamily: "var(--font-arabic)" }}
                dir="rtl"
              >
                طيّارة
              </span>
            </div>
            <span className="hidden text-xs text-muted-foreground sm:block">
              {t("subtitle")}
            </span>
          </div>
        </div>

        {/* Right side: sync + language toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={handleRefresh}
            className="group hidden items-center gap-2 rounded-full border border-border/70 bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-accent/40 hover:text-foreground md:flex"
            aria-label="Refresh sync"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            <span>{lastSyncText}</span>
            <RefreshCw
              className={`h-3 w-3 transition-transform ${
                isRefreshing ? "animate-spin" : "group-hover:rotate-90"
              }`}
            />
          </button>

          <button
            type="button"
            onClick={handleRefresh}
            className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-card text-muted-foreground"
            aria-label="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>

          {/* Language toggle pill */}
          <div
            className="inline-flex items-center rounded-full border border-border/70 bg-card p-1"
            role="tablist"
            aria-label="Language"
          >
            <Button
              variant="ghost"
              size="sm"
              role="tab"
              aria-selected={language === "en"}
              onClick={() => setLanguage("en")}
              className={`h-7 rounded-full px-3 text-xs font-medium transition-colors ${
                language === "en"
                  ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                  : "text-muted-foreground hover:bg-transparent"
              }`}
            >
              EN
            </Button>
            <Button
              variant="ghost"
              size="sm"
              role="tab"
              aria-selected={language === "ar"}
              onClick={() => setLanguage("ar")}
              className={`h-7 rounded-full px-3 text-xs font-medium transition-colors ${
                language === "ar"
                  ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                  : "text-muted-foreground hover:bg-transparent"
              }`}
              style={{ fontFamily: "var(--font-arabic)" }}
            >
              العربية
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
