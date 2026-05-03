export interface ArbitrageBadge {
  icon: string
  text: string
  savingsPercent?: number
  savingsAmount?: number
}

export interface FlightRoute {
  id: string
  originCode: string
  originFlag: string
  destinationCode: string
  destinationFlag: string
  currentPrice: number
  targetPrice: number
  lastAlert?: string
  priceData: number[] // 14 days sparkline
  arbitrage?: ArbitrageBadge
}

export const mockRoutes: FlightRoute[] = [
  {
    id: "1",
    originCode: "DMM",
    originFlag: "🇸🇦",
    destinationCode: "BOM",
    destinationFlag: "🇮🇳",
    currentPrice: 1847,
    targetPrice: 2200,
    priceData: [2150, 2100, 2050, 2020, 1980, 1950, 1900, 1880, 1850, 1840, 1830, 1850, 1860, 1847],
    arbitrage: {
      icon: "✂️",
      text: "Split via DXB: SAR 1,420",
      savingsPercent: 23,
      savingsAmount: 427,
    },
  },
  {
    id: "2",
    originCode: "DMM",
    originFlag: "🇸🇦",
    destinationCode: "KHI",
    destinationFlag: "🇵🇰",
    currentPrice: 1420,
    targetPrice: 1500,
    priceData: [1600, 1580, 1550, 1520, 1500, 1480, 1460, 1450, 1440, 1430, 1420, 1410, 1420, 1420],
    arbitrage: {
      icon: "📅",
      text: "Leave Sun not Fri: SAR -180",
      savingsAmount: 180,
    },
  },
  {
    id: "3",
    originCode: "RUH",
    originFlag: "🇸🇦",
    destinationCode: "MNL",
    destinationFlag: "🇵🇭",
    currentPrice: 3150,
    targetPrice: 2800,
    priceData: [3300, 3280, 3250, 3220, 3200, 3180, 3160, 3150, 3140, 3130, 3140, 3150, 3150, 3150],
    arbitrage: {
      icon: "✂️",
      text: "Split via DOH: SAR 2,640",
      savingsPercent: 16,
      savingsAmount: 510,
    },
  },
  {
    id: "4",
    originCode: "JED",
    originFlag: "🇸🇦",
    destinationCode: "CAI",
    destinationFlag: "🇪🇬",
    currentPrice: 1090,
    targetPrice: 1200,
    lastAlert: "3 days ago",
    priceData: [1250, 1240, 1220, 1200, 1180, 1160, 1140, 1120, 1110, 1100, 1095, 1090, 1090, 1090],
    arbitrage: {
      icon: "🔀",
      text: "Open-jaw return via SHJ: SAR -220",
      savingsAmount: 220,
    },
  },
]

export interface ChatMessage {
  role: "user" | "assistant"
  content: string
  options?: {
    rank: number
    route: string
    price: number
    airline: string
    details: string[]
  }[]
  reasoning?: {
    currentStep: number
    totalSteps: number
    stepDescription: string
  }
}

export const mockChatMessages: ChatMessage[] = [
  {
    role: "user",
    content: "Find the cheapest way to fly my parents Hyderabad → Riyadh in July",
  },
  {
    role: "assistant",
    content:
      "I searched across 3 airlines and 12 date combinations. Here are the best options for Hyderabad (HYD) → Riyadh (RUH) in July:",
    reasoning: {
      currentStep: 5,
      totalSteps: 5,
      stepDescription: "Ranking results and identifying arbitrage opportunities",
    },
    options: [
      {
        rank: 1,
        route: "HYD → DXB → RUH",
        price: 1820,
        airline: "Flydubai + Flynas",
        details: [
          "Depart Jul 12 (Tue), 2h20m layover in DXB",
          "22% cheaper than direct Saudia flights",
          "Both legs bookable separately for flexibility",
        ],
      },
      {
        rank: 2,
        route: "HYD → DOH → RUH",
        price: 1950,
        airline: "Qatar Airways",
        details: [
          "Depart Jul 14 (Thu), 1h50m layover in DOH",
          "Single booking, seamless connection",
          "Includes 2 checked bags",
        ],
      },
      {
        rank: 3,
        route: "HYD → RUH (Direct)",
        price: 2340,
        airline: "Saudia",
        details: ["Depart Jul 16 (Sat), direct flight", "Noon departure, convenient timing"],
      },
    ],
  },
]

export interface SuggestedPrompt {
  text: string
  lang: "en" | "ar"
}

export const suggestedPrompts: SuggestedPrompt[] = [
  {
    text: "Find the cheapest way to fly my parents Hyderabad → Riyadh in July",
    lang: "en",
  },
  { text: "When should I book my Eid trip to Cairo?", lang: "en" },
  { text: "ابحث عن أرخص رحلة من الرياض إلى مانيلا في يوليو", lang: "ar" },
  { text: "متى أفضل وقت لحجز رحلة العمرة من جدة؟", lang: "ar" },
]
