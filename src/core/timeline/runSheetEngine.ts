/**
 * KOOTTU — Event-Day Run Sheet & iCalendar (.ics) Generator
 *
 * Provides chronological execution scheduling for the day of celebration
 * and generates RFC 5545 compliant .ics calendar files for mobile/desktop calendars.
 */

import type { RunSheetItem, ScheduledTask } from "../types.ts"

/**
 * Format a Date to RFC 5545 iCalendar UTC date-time string: YYYYMMDDTHHMMSSZ
 */
function toIcsTimestamp(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return (
    d.getUTCFullYear() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  )
}

/**
 * Format Date to YYYYMMDD for all-day milestone events
 */
function toIcsDateOnly(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return (
    d.getFullYear() +
    pad(d.getMonth() + 1) +
    pad(d.getDate())
  )
}

/**
 * Generate standard RFC 5545 .ics calendar content for planning milestones
 */
export function generateMilestonesIcs(
  tasks: ScheduledTask[],
  eventDateStr?: string,
  eventTitle: string = "KOOTTU Celebration",
): string {
  const now = new Date()
  const nowIcs = toIcsTimestamp(now)
  const eventDate = eventDateStr ? new Date(eventDateStr) : new Date(now.getTime() + 120 * 86400000)

  let lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//KOOTTU//Celebration Planner//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${eventTitle} Milestones`,
  ]

  tasks.forEach((task, idx) => {
    // Calculate estimated due date based on days before event
    const daysBefore = task.dueDaysBeforeEvent || 30
    const targetDate = new Date(eventDate.getTime() - daysBefore * 86400000)
    const dateStr = toIcsDateOnly(targetDate)

    lines.push(
      "BEGIN:VEVENT",
      `UID:koottu-task-${task.id}-${idx}@koottu.app`,
      `DTSTAMP:${nowIcs}`,
      `DTSTART;VALUE=DATE:${dateStr}`,
      `SUMMARY:${task.title}${task.isCriticalPath ? " [Critical Path]" : ""}`,
      `DESCRIPTION:Category: ${task.category}\\nAssignee: ${task.assignee || "Family Coordinator"}\\nStatus: ${task.status}${task.dependency ? `\\nDepends on: ${task.dependency}` : ""}`,
      `STATUS:${task.status === "Completed" ? "CONFIRMED" : "TENTATIVE"}`,
      "END:VEVENT",
    )
  })

  // Add the Main Celebration Event itself
  const mainDateStr = toIcsDateOnly(eventDate)
  lines.push(
    "BEGIN:VEVENT",
    `UID:koottu-main-event@koottu.app`,
    `DTSTAMP:${nowIcs}`,
    `DTSTART;VALUE=DATE:${mainDateStr}`,
    `SUMMARY:★ ${eventTitle} Celebration Day ★`,
    `DESCRIPTION:Celebration planned with KOOTTU. Make room for what matters.`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
  )

  lines.push("END:VCALENDAR")
  return lines.join("\r\n")
}

/**
 * Generate standard RFC 5545 .ics calendar content for Event-Day Run Sheet
 */
export function generateRunSheetIcs(
  runSheetItems: RunSheetItem[],
  eventDateStr?: string,
  eventTitle: string = "Celebration Day",
): string {
  const now = new Date()
  const nowIcs = toIcsTimestamp(now)
  const baseDate = eventDateStr ? new Date(eventDateStr) : new Date(now.getTime() + 120 * 86400000)
  const baseYear = baseDate.getFullYear()
  const baseMonth = baseDate.getMonth()
  const baseDay = baseDate.getDate()

  let lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//KOOTTU//Event Day Run Sheet//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${eventTitle} Run Sheet`,
  ]

  runSheetItems.forEach((item, idx) => {
    // Parse time string e.g. "09:30 AM"
    let hours = 9
    let minutes = 0
    const timeMatch = item.time.match(/(\d+):(\d+)\s*(AM|PM)?/i)
    if (timeMatch) {
      hours = parseInt(timeMatch[1], 10)
      minutes = parseInt(timeMatch[2], 10)
      const meridiem = (timeMatch[3] || "").toUpperCase()
      if (meridiem === "PM" && hours < 12) hours += 12
      if (meridiem === "AM" && hours === 12) hours = 0
    }

    const start = new Date(baseYear, baseMonth, baseDay, hours, minutes, 0)
    const end = new Date(start.getTime() + 60 * 60000) // 1-hour block default

    lines.push(
      "BEGIN:VEVENT",
      `UID:koottu-rs-${item.id}-${idx}@koottu.app`,
      `DTSTAMP:${nowIcs}`,
      `DTSTART:${toIcsTimestamp(start)}`,
      `DTEND:${toIcsTimestamp(end)}`,
      `SUMMARY:${item.title}`,
      `LOCATION:${item.location || "Venue"}`,
      `DESCRIPTION:Responsible: ${item.owner}\\nStatus: ${item.status}${item.notes ? `\\nNotes: ${item.notes}` : ""}`,
      "END:VEVENT",
    )
  })

  lines.push("END:VCALENDAR")
  return lines.join("\r\n")
}

