/**
 * KOOTTU — Budget Stress Testing Engine
 *
 * Deterministically calculates the financial shock of unexpected real-life
 * changes (guest turnout spikes, peak-season vendor surcharges, emergency setups).
 */

import type { StressTestScenario, UnifiedEventPlan } from "../types.ts"
import { formatINR } from "./budgetEngine.ts"

export function runBudgetStressTests(
  plan: UnifiedEventPlan,
): StressTestScenario[] {
  const currentTotal =
    plan.financials.totalAllocated + plan.financials.contingencyReserve
  const currentDeficit = Math.max(0, currentTotal - plan.financials.totalBudget)
  const guests = plan.identity.guests
  const perPerson = plan.financials.foodPerPerson

  // 1. Guest Count Spike (+20% turnout / extra relatives)
  const extraGuests = Math.round(guests * 0.2)
  const extraCateringCost = extraGuests * perPerson
  const deficitGuestSpike = currentDeficit + extraCateringCost

  // 2. Venue Surcharge (Peak season / air conditioning generator surcharge)
  const venueSurcharge = 50000
  const deficitVenueSpike = currentDeficit + venueSurcharge

  // 3. Monsoon / Weather Emergency (Canopy/Shamiana & waterproof sound equipment)
  const weatherEmergency = 40000
  const deficitWeather = currentDeficit + weatherEmergency

  // 4. Photography Coverage Extension (+Cinematic Drone & 4 hours reception coverage)
  const photoExtension = 25000
  const deficitPhoto = currentDeficit + photoExtension

  return [
    {
      id: "stress-guests-20",
      title: `+20% Guest Surge (+${extraGuests} guests)`,
      description: `What if turnout increases by 20% due to extended family attendance?`,
      deltaBudget: 0,
      deltaGuests: extraGuests,
      deltaExpenses: extraCateringCost,
      resultingDeficit: deficitGuestSpike,
      affectedCategories: ["food"],
      impactSummary: `Adds ${formatINR(extraCateringCost)} in catering (${extraGuests} guests × ${formatINR(perPerson)}). Resulting total deficit: ${formatINR(deficitGuestSpike)}.`,
    },
    {
      id: "stress-venue-surcharge",
      title: "Venue Peak-Season Premium (+₹50k)",
      description:
        "What if the chosen mandapam levies a peak-season air-conditioning and generator surcharge?",
      deltaBudget: 0,
      deltaGuests: 0,
      deltaExpenses: venueSurcharge,
      resultingDeficit: deficitVenueSpike,
      affectedCategories: ["venue"],
      impactSummary: `Adds ${formatINR(venueSurcharge)} to venue expense. Resulting total deficit: ${formatINR(deficitVenueSpike)}.`,
    },
    {
      id: "stress-weather-monsoon",
      title: "Monsoon Waterproofing (+₹40k)",
      description:
        "What if sudden rain requires an emergency covered shamiana and waterproof dining tunnel?",
      deltaBudget: 0,
      deltaGuests: 0,
      deltaExpenses: weatherEmergency,
      resultingDeficit: deficitWeather,
      affectedCategories: ["venue", "other"],
      impactSummary: `Adds ${formatINR(weatherEmergency)} in logistics and pandhal rental. Resulting total deficit: ${formatINR(deficitWeather)}.`,
    },
    {
      id: "stress-photo-extension",
      title: "Drone & Cinematic Film Add-on (+₹25k)",
      description:
        "What if you add full 4K drone reels and pre-wedding traditional portraiture?",
      deltaBudget: 0,
      deltaGuests: 0,
      deltaExpenses: photoExtension,
      resultingDeficit: deficitPhoto,
      affectedCategories: ["photo"],
      impactSummary: `Adds ${formatINR(photoExtension)} to visual media. Resulting total deficit: ${formatINR(deficitPhoto)}.`,
    },
  ]
}
