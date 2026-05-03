"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

type Language = "en" | "ar"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const translations: Record<Language, Record<string, string>> = {
  en: {
    appName: "Tayyara",
    appNameArabic: "طيّارة",
    subtitle: "Your AI flight scout.",
    langToggle: "EN",
    langToggleAlt: "العربية",
    lastSync: "Last sync:",
    timeAgo: "{} ago",
    minutes: "min",
    addRoute: "+ Add a new route to watch",
    watchedRoutes: "Watched routes",
    addRouteShort: "Add route",
    routeDirect: "Direct",
    alertUnder: "Alert under SAR {}",
    watching: "Watching...",
    edit: "Edit",
    pause: "Pause",
    chatTitle: "Ask Tayyara to research",
    chatPlaceholder: "e.g. Find the cheapest way to Mumbai in July...",
    emptyPrompt1: "Find the cheapest way to fly my parents Hyderabad → Riyadh in July",
    emptyPrompt2: "When should I book my Eid trip to Cairo?",
    send: "Send",
    agentStep: "Step {} of {}: {}",
    addToWatch: "Add to watch",
    footer: "Built on Vercel Workflow + AI Gateway",
    origin: "Origin",
    destination: "Destination",
    sar: "SAR",
    savings: "savings",
  },
  ar: {
    appName: "طيّارة",
    appNameArabic: "Tayyara",
    subtitle: "وكيل رحلاتك الذكي.",
    langToggle: "العربية",
    langToggleAlt: "EN",
    lastSync: "آخر تحديث:",
    timeAgo: "قبل {}",
    minutes: "د",
    addRoute: "+ إضافة طريق جديد للمراقبة",
    watchedRoutes: "الطرق المراقبة",
    addRouteShort: "إضافة طريق",
    routeDirect: "مباشر",
    alertUnder: "تنبيه عند {} ريال",
    watching: "قيد المراقبة...",
    edit: "تعديل",
    pause: "إيقاف",
    chatTitle: "اطلب من طيّارة البحث",
    chatPlaceholder: "مثال: ابحث عن أرخص طريقة إلى مومباي في يوليو...",
    emptyPrompt1: "ابحث عن أرخص رحلة من الرياض إلى مانيلا في يوليو",
    emptyPrompt2: "متى أفضل وقت لحجز رحلة العمرة من جدة؟",
    send: "إرسال",
    agentStep: "الخطوة {} من {}: {}",
    addToWatch: "إضافة للمراقبة",
    footer: "مبني على Vercel Workflow + AI Gateway",
    origin: "الأصل",
    destination: "الوجهة",
    sar: "ر.س",
    savings: "توفير",
  },
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en")

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    // Update HTML dir and lang attributes
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("dir", lang === "ar" ? "rtl" : "ltr")
      document.documentElement.setAttribute("lang", lang === "ar" ? "ar" : "en")
    }
  }

  const t = (key: string): string => {
    return translations[language][key] || key
  }

  // Initialize on mount
  useEffect(() => {
    const htmlDir = document.documentElement.getAttribute("dir")
    if (htmlDir === "rtl") {
      setLanguageState("ar")
    }
  }, [])

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider")
  }
  return context
}
