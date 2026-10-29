export type EventColor = 'lavender' | 'mint' | 'blue' | 'peach'

export interface CalEvent {
  id: string
  title: string
  date: string // YYYY-MM-DD (local)
  start: string // HH:MM
  end: string // HH:MM
  description: string
  color: EventColor
}

export type Draft = Omit<CalEvent, 'id'> & { id?: string }

export const HOUR_PX = 56
export const COLORS: { id: EventColor; label: string }[] = [
  { id: 'lavender', label: 'Lavender' },
  { id: 'mint', label: 'Mint' },
  { id: 'blue', label: 'Blue' },
  { id: 'peach', label: 'Peach' },
]

/* ---------- dates ---------- */
export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
export const startOfWeek = (d: Date) => addDays(d, -d.getDay()) // Sunday
export const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

const p2 = (n: number) => String(n).padStart(2, '0')
export const toKey = (d: Date) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`
export const fromKey = (k: string) => {
  const [y, m, d] = k.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const toMin = (t: string) => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}
export const fromMin = (m: number) => {
  const c = Math.max(0, Math.min(1439, Math.round(m)))
  return `${p2(Math.floor(c / 60))}:${p2(c % 60)}`
}

/* ---------- formatting ---------- */
const fmt = (d: Date, o: Intl.DateTimeFormatOptions) => d.toLocaleDateString('en-US', o)

export function weekLabel(weekStart: Date) {
  const end = addDays(weekStart, 6)
  if (weekStart.getMonth() === end.getMonth()) return fmt(weekStart, { month: 'long', year: 'numeric' })
  if (weekStart.getFullYear() === end.getFullYear())
    return `${fmt(weekStart, { month: 'short' })} – ${fmt(end, { month: 'short', year: 'numeric' })}`
  return `${fmt(weekStart, { month: 'short', year: 'numeric' })} – ${fmt(end, { month: 'short', year: 'numeric' })}`
}
export const monthLabel = (d: Date) => fmt(d, { month: 'long', year: 'numeric' })
export const longDate = (d: Date) => fmt(d, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
export const shortDate = (d: Date) => fmt(d, { weekday: 'short', month: 'short', day: 'numeric' })
export const weekdayShort = (d: Date) => fmt(d, { weekday: 'short' })

export function fmtTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${p2(m)} ${h < 12 ? 'AM' : 'PM'}`
}
export function fmtRange(start: string, end: string) {
  const sh = Number(start.split(':')[0])
  const eh = Number(end.split(':')[0])
  if (sh < 12 === eh < 12) return `${fmtTime(start).replace(/ [AP]M$/, '')} – ${fmtTime(end)}`
  return `${fmtTime(start)} – ${fmtTime(end)}`
}
export const hourLabel = (h: number) => `${h % 12 || 12} ${h < 12 ? 'AM' : 'PM'}`

export function gmtLabel(ts: number) {
  const off = -new Date(ts).getTimezoneOffset()
  const sign = off >= 0 ? '+' : '-'
  const a = Math.abs(off)
  return `GMT${sign}${p2(Math.floor(a / 60))}:${p2(a % 60)}`
}

/* ---------- overlap layout ---------- */
export interface Laid {
  ev: CalEvent
  col: number
  cols: number
}

export function layoutDay(evs: CalEvent[]): Laid[] {
  const items = evs
    .map((ev) => ({ ev, s: toMin(ev.start), e: Math.max(toMin(ev.end), toMin(ev.start) + 15) }))
    .sort((a, b) => a.s - b.s || b.e - a.e)
  const out: Laid[] = []
  let cluster: { ev: CalEvent; col: number }[] = []
  let colEnds: number[] = []
  let clusterEnd = -1
  const flush = () => {
    cluster.forEach((c) => out.push({ ev: c.ev, col: c.col, cols: colEnds.length }))
    cluster = []
    colEnds = []
    clusterEnd = -1
  }
  for (const it of items) {
    if (cluster.length && it.s >= clusterEnd) flush()
    let col = colEnds.findIndex((end) => end <= it.s)
    if (col === -1) {
      col = colEnds.length
      colEnds.push(it.e)
    } else colEnds[col] = it.e
    cluster.push({ ev: it.ev, col })
    clusterEnd = Math.max(clusterEnd, it.e)
  }
  flush()
  return out
}

/* ---------- local demo helper for the chat panel ---------- */
export function findFreeSlot(
  events: CalEvent[],
  weekStart: Date,
  minutes: number,
  nowTs: number,
): { date: string; start: string; end: string } | null {
  const now = new Date(nowTs)
  const todayKey = toKey(now)
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const DAY_START = 9 * 60
  const DAY_END = 20 * 60
  for (let i = 0; i < 7; i++) {
    const key = toKey(addDays(weekStart, i))
    if (key < todayKey) continue
    let cursor = key === todayKey ? Math.max(DAY_START, Math.ceil((nowMin + 15) / 30) * 30) : DAY_START
    const day = events
      .filter((e) => e.date === key)
      .map((e) => [toMin(e.start), toMin(e.end)] as const)
      .sort((a, b) => a[0] - b[0])
    for (const [s, e] of day) {
      if (s - cursor >= minutes) break
      cursor = Math.max(cursor, e)
    }
    if (cursor + minutes <= DAY_END) return { date: key, start: fromMin(cursor), end: fromMin(cursor + minutes) }
  }
  return null
}
