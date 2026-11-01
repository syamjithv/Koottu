/**
 * KOOTTU — Authentic Cultural Ideas Catalog
 *
 * Grounded Kerala celebration concepts used for instant suggestions
 * and deterministic fallback when offline or during quota exhaustion.
 */

import type { EventIdea } from "../types.ts"

export const DEFAULT_CULTURAL_IDEAS: EventIdea[] = [
  {
    id: "idea-theme-kasavu",
    category: "theme",
    title: "Kasavu & Warm Brass Heritage Theme",
    description:
      "A timeless Kerala aesthetic featuring off-white Kasavu drapes, marigold garlands, and polished brass Nilavilakku oil lamps for a warm, auspicious ambience.",
    estimatedCostRange: "Included in Decor floor (₹28,000)",
    saved: false,
  },
  {
    id: "idea-food-payasam",
    category: "food",
    title: "Twin-Payasam Tasting Station",
    description:
      "Complement the traditional Sadya with a dedicated hot dessert counter serving authentic Palada Pradhaman and rich Jaggery-Parippu Payasam in clay cups.",
    estimatedCostRange: "₹8,000 – ₹12,000 add-on",
    saved: false,
  },
  {
    id: "idea-decor-plantain",
    category: "decor",
    title: "Living Plantain & Coconut Frond Arch",
    description:
      "Traditional Kerala welcome entrance with fresh whole plantain trees bearing fruit (Vazhamaram) and tender coconut leaf weaves (Kuruthola).",
    estimatedCostRange: "₹6,000 – ₹10,000",
    saved: false,
  },
  {
    id: "idea-activity-nadaswaram",
    category: "activity",
    title: "Live Nadaswaram & Thavil Welcoming",
    description:
      "Traditional instrumental duo playing auspicious Carnatic ragas as guests arrive, setting an authentic ceremonial atmosphere without high audio amplification.",
    estimatedCostRange: "₹15,000 – ₹20,000",
    saved: false,
  },
  {
    id: "idea-cultural-return",
    category: "cultural",
    title: "Eco-Friendly Spices & Kasavu Return Keepsake",
    description:
      "Replace plastic mementos with small jute pouches of Wayanad cardamom and Kerala handloom handkerchiefs for visiting elders and family.",
    estimatedCostRange: "₹120 – ₹180 per family",
    saved: false,
  },
]
