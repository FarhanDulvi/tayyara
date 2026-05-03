"use client"

import { useLanguage } from "@/components/language-provider"

export function Footer() {
  const { t } = useLanguage()

  return (
    <footer className="sticky bottom-0 z-20 border-t border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1400px] items-center justify-center gap-2 px-4 py-2 text-[11px] text-muted-foreground sm:px-6 lg:px-8">
        <span>{t("footer")}</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 76 65"
          className="h-2.5 w-2.5 fill-current"
        >
          <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
        </svg>
      </div>
    </footer>
  )
}
