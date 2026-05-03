"use client"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { RouteCard } from "@/components/route-card"
import { mockRoutes } from "@/lib/mock-data"
import { useLanguage } from "@/components/language-provider"

export function Dashboard() {
  const { t } = useLanguage()

  return (
    <div className="w-full">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">{t("watchedRoutes")}</h2>
        <Button
          size="sm"
          className="gap-2 rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">{t("addRouteShort")}</span>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
        {mockRoutes.map((route) => (
          <RouteCard key={route.id} route={route} />
        ))}
      </div>
    </div>
  )
}
