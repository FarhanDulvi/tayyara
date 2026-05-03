"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Pencil, Pause, BellRing, ChevronDown } from "lucide-react"
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis } from "recharts"
import type { FlightRoute } from "@/lib/mock-data"
import { useLanguage } from "@/components/language-provider"

interface RouteCardProps {
  route: FlightRoute
}

export function RouteCard({ route }: RouteCardProps) {
  const { language, t } = useLanguage()
  const [expanded, setExpanded] = useState(false)
  const isRTL = language === "ar"

  const sparklineData = route.priceData.map((price, i) => ({ day: i, price }))

  // Determine trend color
  const firstPrice = route.priceData[0]
  const lastPrice = route.priceData[route.priceData.length - 1]
  const trendDown = lastPrice < firstPrice
  const belowTarget = route.currentPrice <= route.targetPrice

  const formatSAR = (value: number) =>
    new Intl.NumberFormat(language === "ar" ? "ar-SA" : "en-US", {
      maximumFractionDigits: 0,
    }).format(value)

  return (
    <Card className="group relative gap-0 overflow-hidden rounded-2xl border-border/60 bg-card p-5 shadow-sm transition-all hover:border-accent/30 hover:shadow-md">
      {/* Top row: route + actions */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-base font-medium text-foreground">
          <span className="flex items-center gap-1.5">
            <span className="text-lg leading-none" aria-hidden="true">
              {route.originFlag}
            </span>
            <span className="font-mono text-sm tracking-wide">{route.originCode}</span>
          </span>
          <ArrowRight
            className={`h-4 w-4 text-muted-foreground/60 ${isRTL ? "rotate-180" : ""}`}
          />
          <span className="flex items-center gap-1.5">
            <span className="text-lg leading-none" aria-hidden="true">
              {route.destinationFlag}
            </span>
            <span className="font-mono text-sm tracking-wide">
              {route.destinationCode}
            </span>
          </span>
        </div>

        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            aria-label={t("edit")}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            aria-label={t("pause")}
          >
            <Pause className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Price block */}
      <div className="mt-4 flex items-end justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {t("routeDirect")}
          </span>
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-3xl font-semibold tracking-tight tabular-nums ${
                belowTarget ? "text-accent" : "text-foreground"
              }`}
            >
              {formatSAR(route.currentPrice)}
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              {t("sar")}
            </span>
          </div>
          <span className="mt-0.5 text-xs text-muted-foreground">
            {language === "ar"
              ? `تنبيه عند ${formatSAR(route.targetPrice)} ${t("sar")}`
              : `Alert under SAR ${formatSAR(route.targetPrice)}`}
          </span>
        </div>

        {/* Sparkline */}
        <div className="h-12 w-28 sm:w-32">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={sparklineData}
              margin={{ top: 4, bottom: 4, left: 0, right: 0 }}
            >
              <XAxis hide dataKey="day" reversed={isRTL} />
              <YAxis hide domain={["dataMin - 50", "dataMax + 50"]} />
              <Line
                type="monotone"
                dataKey="price"
                stroke={trendDown ? "var(--accent)" : "var(--chart-3)"}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Arbitrage stack */}
      {route.arbitrage && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-4 flex w-full items-center justify-between gap-2 rounded-xl border border-accent/15 bg-accent/8 px-3 py-2 text-start transition-colors hover:bg-accent/15"
        >
          <span className="flex min-w-0 items-center gap-2">
            <span className="text-base leading-none" aria-hidden="true">
              {route.arbitrage.icon}
            </span>
            <span className="truncate text-xs font-medium text-foreground">
              {route.arbitrage.text}
            </span>
            {route.arbitrage.savingsPercent && (
              <Badge
                variant="secondary"
                className="shrink-0 bg-accent/15 text-[10px] font-semibold text-accent hover:bg-accent/15"
              >
                -{route.arbitrage.savingsPercent}%
              </Badge>
            )}
          </span>
          <ChevronDown
            className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${
              expanded ? "rotate-180" : ""
            }`}
          />
        </button>
      )}

      {/* Expanded arbitrage detail */}
      {expanded && route.arbitrage && (
        <div className="mt-2 rounded-xl border border-border/40 bg-muted/40 p-3 text-xs text-muted-foreground leading-relaxed">
          {language === "ar"
            ? `وجد الوكيل بناءً بديلاً يوفر ${
                route.arbitrage.savingsAmount ?? "—"
              } ريال. اضغط على "إضافة للمراقبة" لتتبع هذا البناء.`
            : `Tayyara found an alternative construction saving ${
                route.arbitrage.savingsAmount ?? "—"
              } SAR. Tap "Add to watch" to track this construction.`}
        </div>
      )}

      {/* Footer: alert badge */}
      <div className="mt-4 flex items-center justify-between gap-2 border-t border-border/40 pt-3">
        {route.lastAlert ? (
          <Badge className="gap-1 rounded-full border-0 bg-primary/8 px-2.5 py-0.5 text-[10px] font-medium text-primary hover:bg-primary/8">
            <BellRing className="h-3 w-3" />
            {language === "ar" ? `تنبيه قبل ${route.lastAlert}` : `Alert · ${route.lastAlert}`}
          </Badge>
        ) : (
          <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent/60 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
            </span>
            {t("watching")}
          </span>
        )}
      </div>
    </Card>
  )
}
