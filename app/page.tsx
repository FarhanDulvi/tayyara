"use client"

import { useState } from "react"
import { LanguageProvider } from "@/components/language-provider"
import { Header } from "@/components/header"
import { Dashboard } from "@/components/dashboard"
import { ResearchChat } from "@/components/research-chat"
import { Footer } from "@/components/footer"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { MessageSquare } from "lucide-react"
import { useLanguage } from "@/components/language-provider"

function MobileChatSheet() {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          size="lg"
          className="fixed bottom-12 end-4 z-40 h-14 w-14 rounded-full bg-primary p-0 text-primary-foreground shadow-lg hover:bg-primary/90 lg:hidden"
          aria-label={t("chatTitle")}
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="h-[85vh] rounded-t-3xl border-t border-border p-0"
      >
        <SheetTitle className="sr-only">{t("chatTitle")}</SheetTitle>
        <ResearchChat />
      </SheetContent>
    </Sheet>
  )
}

function PageContent() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1">
        <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="grid gap-6 lg:grid-cols-[3fr_2fr] lg:gap-8">
            {/* Dashboard - left ~60% */}
            <section aria-label="Watched routes">
              <Dashboard />
            </section>

            {/* Research chat - right ~40%, hidden on mobile */}
            <section
              aria-label="Research chat"
              className="hidden lg:flex lg:sticky lg:top-[88px] lg:h-[calc(100vh-148px)] lg:flex-col lg:overflow-hidden lg:rounded-2xl lg:border lg:border-border/60 lg:bg-card lg:shadow-sm"
            >
              <ResearchChat />
            </section>
          </div>
        </div>
      </main>

      <MobileChatSheet />
      <Footer />
    </div>
  )
}

export default function Page() {
  return (
    <LanguageProvider>
      <PageContent />
    </LanguageProvider>
  )
}
