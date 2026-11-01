import { test } from "node:test"
import assert from "node:assert/strict"
import { generateMilestonesIcs, generateRunSheetIcs } from "./runSheetEngine.ts"
import { KERALA_WEDDING_TEMPLATE } from "../templates/occasionTemplates.ts"

test("runSheetEngine: generates valid RFC 5545 iCalendar for milestones", () => {
  const ics = generateMilestonesIcs(
    KERALA_WEDDING_TEMPLATE.defaultTasks,
    "2026-12-15",
    "Radha & Vivek Wedding",
  )

  assert.ok(ics.startsWith("BEGIN:VCALENDAR"))
  assert.ok(ics.includes("VERSION:2.0"))
  assert.ok(ics.includes("SUMMARY:Confirm wedding auditorium / mandapam [Critical Path]"))
  assert.ok(ics.includes("★ Radha & Vivek Wedding Celebration Day ★"))
  assert.ok(ics.endsWith("END:VCALENDAR"))
})

test("runSheetEngine: generates valid RFC 5545 iCalendar for event-day run sheet", () => {
  const ics = generateRunSheetIcs(
    KERALA_WEDDING_TEMPLATE.defaultRunSheet,
    "2026-12-15",
    "Wedding Day",
  )

  assert.ok(ics.startsWith("BEGIN:VCALENDAR"))
  assert.ok(ics.includes("Muhurtham Ceremony (Thalikettu & Garland Exchange)"))
  assert.ok(ics.includes("Traditional Elasadhya Banquet"))
  assert.ok(ics.endsWith("END:VCALENDAR"))
})

