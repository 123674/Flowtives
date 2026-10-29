import { addDays, startOfDay, startOfWeek, toKey, type CalEvent } from './lib'

const KEY = 'flowtives.calendar.events.v1'
const EMPTY: CalEvent[] = []
let cache: CalEvent[] | null = null
const listeners = new Set<() => void>()

/** First-visit demo events, echoing the plan shown on the Flowtives homepage. */
function seed(): CalEvent[] {
  const today = startOfDay(new Date())
  const ws = startOfWeek(today)
  const e = (id: string, d: Date, title: string, start: string, end: string, color: CalEvent['color'], description = ''): CalEvent => ({
    id,
    title,
    date: toKey(d),
    start,
    end,
    color,
    description,
  })
  return [
    e('seed-1', addDays(ws, 1), 'Biology lecture', '09:00', '10:30', 'blue', 'Cell structure and membranes'),
    e('seed-2', addDays(ws, 4), 'Group study', '10:00', '11:30', 'lavender', 'Library, second floor'),
    e('seed-3', addDays(ws, 4), 'Chemistry lab', '11:00', '12:30', 'mint'),
    e('seed-4', today, 'Badminton', '17:00', '18:00', 'mint', 'Move your body'),
    e('seed-5', today, 'Review lecture notes', '18:15', '18:50', 'lavender', 'Biology'),
    e('seed-6', today, 'Dinner + reset', '19:00', '19:45', 'peach', 'Take a proper break'),
  ]
}

function load(): CalEvent[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed as CalEvent[]
    }
    const initial = seed()
    localStorage.setItem(KEY, JSON.stringify(initial))
    return initial
  } catch {
    return seed()
  }
}

export const eventStore = {
  subscribe(cb: () => void) {
    listeners.add(cb)
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) {
        cache = null
        cb()
      }
    }
    window.addEventListener('storage', onStorage)
    return () => {
      listeners.delete(cb)
      window.removeEventListener('storage', onStorage)
    }
  },
  getSnapshot(): CalEvent[] {
    if (cache === null) cache = load()
    return cache
  },
  getServerSnapshot: (): CalEvent[] => EMPTY,
  set(next: CalEvent[]) {
    cache = next
    try {
      localStorage.setItem(KEY, JSON.stringify(next))
    } catch {
      /* storage unavailable: keep in memory only */
    }
    listeners.forEach((l) => l())
  },
}

/* Minute-resolution clock. Server snapshot is 0 so first paint matches SSR. */
export const clock = {
  subscribe(cb: () => void) {
    const id = window.setInterval(cb, 20000)
    return () => window.clearInterval(id)
  },
  getSnapshot: () => Math.floor(Date.now() / 60000) * 60000,
  getServerSnapshot: () => 0,
}
