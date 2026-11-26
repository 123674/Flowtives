import type { CalEvent, EventColor } from '../app/calendar/lib'

export const CATEGORIES = ['Classes', 'Study', 'Fitness', 'Social', 'Meals and breaks', 'Personal', 'Other'] as const
type BuiltInCategory = (typeof CATEGORIES)[number]
export type Category = string
export const TIME_SLOTS = ['Morning', 'Afternoon', 'Evening', 'Late'] as const
export type TimeSlot = (typeof TIME_SLOTS)[number]

export type AnalyticsEvent = Pick<CalEvent, 'id' | 'title' | 'date' | 'description' | 'color'> & {
  start?: string
  end?: string
}

const CUSTOM_CATEGORY_COLORS: readonly EventColor[] = ['lavender', 'mint', 'blue', 'peach']

export function categoryColor(category: Category): EventColor {
  const builtInCategory = CATEGORIES.find((candidate) => candidate === category)
  const builtInColor = builtInCategory ? CATEGORY_COLORS[builtInCategory] : undefined
  if (builtInColor) return builtInColor
  let hash = 0
  for (const character of category) hash = (hash * 31 + character.charCodeAt(0)) >>> 0
  return CUSTOM_CATEGORY_COLORS[hash % CUSTOM_CATEGORY_COLORS.length]
}

export interface DaySummary {
  date: Date
  minutesByCategory: Record<Category, number>
  minutesByTimeSlot: Record<TimeSlot, number>
  allDayCount: number
  overlaps: number
  totalMinutes: number
}

export interface WeekSummary {
  start: Date
  end: Date
  days: DaySummary[]
  categories: readonly Category[]
  minutesByCategory: Record<Category, number>
  totalMinutes: number
  allDayCount: number
  overlaps: number
  invalidCount: number
}

export interface WeekComparison {
  minutesByCategory: Record<Category, number>
  totalMinutes: number
  breaksMinutes: number
  studyMinutes: number
}

export interface WeekRange {
  start: Date
  end: Date
}

export type CategoryResolver = (event: AnalyticsEvent) => Category

const KEYWORDS: Readonly<Record<BuiltInCategory, readonly string[]>> = {
  Classes: ['lecture', 'class', 'lab', 'seminar'],
  Study: ['study', 'revise', 'review', 'notes', 'assignment', 'homework', 'exam'],
  Fitness: ['badminton', 'gym', 'run', 'workout', 'yoga', 'swim'],
  Social: ['friends', 'party', 'hangout', 'club', 'movie'],
  'Meals and breaks': ['dinner', 'lunch', 'breakfast', 'break', 'coffee', 'reset'],
  Personal: ['personal', 'appointment', 'errand', 'laundry'],
  Other: [],
}

const COLOR_CATEGORY: Readonly<Record<EventColor, Category>> = {
  lavender: 'Study',
  mint: 'Fitness',
  blue: 'Classes',
  peach: 'Meals and breaks',
}

export const CATEGORY_COLORS: Readonly<Record<BuiltInCategory, EventColor>> = {
  Classes: 'blue',
  Study: 'lavender',
  Fitness: 'mint',
  Social: 'peach',
  'Meals and breaks': 'peach',
  Personal: 'blue',
  Other: 'mint',
}

const validDate = (date: Date) => !Number.isNaN(date.getTime())

function parseLocalDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null
}

function localDateKey(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function emptyMinutes(categories: readonly Category[] = CATEGORIES): Record<Category, number> {
  return Object.fromEntries(categories.map((category) => [category, 0]))
}

function emptySlots(): Record<TimeSlot, number> {
  return { Morning: 0, Afternoon: 0, Evening: 0, Late: 0 }
}

function addCalendarDays(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount)
}

function parseLocalTime(date: Date, value: string): Date | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value)
  if (!match) return null
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate(), Number(match[1]), Number(match[2]))
  return result.getHours() === Number(match[1]) && result.getMinutes() === Number(match[2]) ? result : null
}

function isAnalyticsEvent(event: AnalyticsEvent): boolean {
  return Boolean(
    event &&
      typeof event.id === 'string' &&
      typeof event.title === 'string' &&
      typeof event.date === 'string' &&
      typeof event.description === 'string' &&
      typeof event.color === 'string' &&
      ['lavender', 'mint', 'blue', 'peach'].includes(event.color),
  )
}

/** Match titles before descriptions; stored calendar colours take precedence over keywords. */
export function categorise(event: AnalyticsEvent): Category {
  const colorCategory = COLOR_CATEGORY[event.color]
  if (colorCategory) return colorCategory

  const matchText = (text: string) => {
    const lower = text.toLowerCase()
    return CATEGORIES.find((category) => KEYWORDS[category].some((word) => lower.includes(word)))
  }
  return matchText(event.title) ?? matchText(event.description) ?? 'Other'
}

export function getWeekRange(date: Date, weekStart: number): WeekRange | null {
  if (!validDate(date) || !Number.isInteger(weekStart) || weekStart < 0 || weekStart > 6) return null
  const start = addCalendarDays(date, -((date.getDay() - weekStart + 7) % 7))
  return { start, end: addCalendarDays(start, 6) }
}

export function summariseWeek(
  events: readonly AnalyticsEvent[],
  weekStart: Date,
  categoryOf: CategoryResolver = categorise,
  categories: readonly Category[] = CATEGORIES,
): WeekSummary {
  const categoryNames = [...new Set(categories)]
  const safeWeekStart = validDate(weekStart) ? weekStart : new Date(0)
  const range = getWeekRange(safeWeekStart, safeWeekStart.getDay())
  const start = range?.start ?? new Date(safeWeekStart)
  const end = range?.end ?? new Date(safeWeekStart)
  const days = Array.from({ length: 7 }, (_, index): DaySummary => ({
    date: addCalendarDays(start, index),
    minutesByCategory: emptyMinutes(categoryNames),
    minutesByTimeSlot: emptySlots(),
    allDayCount: 0,
    overlaps: 0,
    totalMinutes: 0,
  }))
  let invalidCount = 0

  if (!validDate(weekStart)) {
    return { start, end, days, categories: categoryNames, minutesByCategory: emptyMinutes(categoryNames), totalMinutes: 0, allDayCount: 0, overlaps: 0, invalidCount: events.length }
  }

  const weekStartMs = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime()
  const weekEndMs = new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1).getTime()
  const intervals = days.map(() => [] as { start: number; end: number; category: Category }[])

  for (const event of events) {
    if (!isAnalyticsEvent(event)) {
      invalidCount++
      continue
    }
    const eventDate = parseLocalDate(event.date)
    if (!eventDate) {
      invalidCount++
      continue
    }
    const dayIndex = days.findIndex((day) => localDateKey(day.date) === localDateKey(eventDate))
    if (!event.start && !event.end) {
      if (dayIndex >= 0 && dayIndex < 7) days[dayIndex].allDayCount++
      continue
    }
    if (!event.start || !event.end) {
      invalidCount++
      continue
    }
    const eventStart = parseLocalTime(eventDate, event.start)
    const sameDayEnd = parseLocalTime(eventDate, event.end)
    if (!eventStart || !sameDayEnd) {
      invalidCount++
      continue
    }
    if (sameDayEnd.getTime() === eventStart.getTime()) continue
    const eventEnd = sameDayEnd.getTime() < eventStart.getTime()
      ? parseLocalTime(addCalendarDays(eventDate, 1), event.end)
      : sameDayEnd
    if (!eventEnd) {
      invalidCount++
      continue
    }
    const clippedStart = Math.max(eventStart.getTime(), weekStartMs)
    const clippedEnd = Math.min(eventEnd.getTime(), weekEndMs)
    if (clippedEnd <= clippedStart) continue

    let cursor = clippedStart
    while (cursor < clippedEnd) {
      const currentDay = new Date(cursor)
      const nextDay = new Date(currentDay.getFullYear(), currentDay.getMonth(), currentDay.getDate() + 1)
      const segmentEnd = Math.min(clippedEnd, nextDay.getTime())
      const index = days.findIndex((day) => localDateKey(day.date) === localDateKey(currentDay))
      if (index >= 0 && index < 7 && segmentEnd > cursor) {
        intervals[index].push({ start: cursor, end: segmentEnd, category: categoryOf(event) })
      }
      cursor = segmentEnd
    }
  }

  days.forEach((day, index) => {
    const sorted = intervals[index].sort((a, b) => a.start - b.start || a.end - b.end)
    let occupiedUntil = new Date(day.date.getFullYear(), day.date.getMonth(), day.date.getDate()).getTime()
    for (const interval of sorted) {
      const startMs = Math.max(interval.start, occupiedUntil)
      if (interval.start < occupiedUntil) day.overlaps++
      if (interval.end <= startMs) continue
      const minutes = (interval.end - startMs) / 60_000
      day.minutesByCategory[interval.category] += minutes
      day.totalMinutes += minutes
      let slotCursor = startMs
      while (slotCursor < interval.end) {
        const slotDate = new Date(slotCursor)
        const hour = slotDate.getHours()
        const slot: TimeSlot = hour >= 6 && hour < 12 ? 'Morning' : hour >= 12 && hour < 17 ? 'Afternoon' : hour >= 17 && hour < 22 ? 'Evening' : 'Late'
        const boundary = hour < 6
          ? new Date(slotDate.getFullYear(), slotDate.getMonth(), slotDate.getDate(), 6)
          : hour < 12
            ? new Date(slotDate.getFullYear(), slotDate.getMonth(), slotDate.getDate(), 12)
            : hour < 17
              ? new Date(slotDate.getFullYear(), slotDate.getMonth(), slotDate.getDate(), 17)
              : hour < 22
                ? new Date(slotDate.getFullYear(), slotDate.getMonth(), slotDate.getDate(), 22)
                : new Date(slotDate.getFullYear(), slotDate.getMonth(), slotDate.getDate() + 1, 6)
        const slotEnd = Math.min(boundary.getTime(), interval.end)
        day.minutesByTimeSlot[slot] += (slotEnd - slotCursor) / 60_000
        slotCursor = slotEnd
      }
      occupiedUntil = interval.end
    }
  })

  const minutesByCategory = emptyMinutes(categoryNames)
  for (const day of days) {
    for (const category of categoryNames) minutesByCategory[category] += day.minutesByCategory[category]
  }
  return {
    start,
    end,
    days,
    categories: categoryNames,
    minutesByCategory,
    totalMinutes: days.reduce((sum, day) => sum + day.totalMinutes, 0),
    allDayCount: days.reduce((sum, day) => sum + day.allDayCount, 0),
    overlaps: days.reduce((sum, day) => sum + day.overlaps, 0),
    invalidCount,
  }
}

export function compareWeeks(a: WeekSummary, b: WeekSummary): WeekComparison {
  const categories = [...new Set([...a.categories, ...b.categories])]
  const minutesByCategory = emptyMinutes(categories)
  for (const category of categories) minutesByCategory[category] = (a.minutesByCategory[category] ?? 0) - (b.minutesByCategory[category] ?? 0)
  return {
    minutesByCategory,
    totalMinutes: a.totalMinutes - b.totalMinutes,
    breaksMinutes: minutesByCategory['Meals and breaks'],
    studyMinutes: minutesByCategory.Study,
  }
}

export function formatPercentChange(difference: number, baseline: number): string {
  if (baseline === 0) return difference === 0 ? '0%' : 'new'
  return `${Math.round(Math.abs(difference / baseline) * 100)}%`
}
