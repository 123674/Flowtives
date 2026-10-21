'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import s from '../calendar.module.css'
import { addDays, isSameDay, longDate, monthLabel, startOfWeek, toKey, type CalEvent } from '../lib'

const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const DOW_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

/** Remount with key={selected date} so the month follows the selection; arrows browse freely. */
export default function MiniCalendar({
  selected,
  today,
  events,
  onSelect,
}: {
  selected: Date
  today: Date
  events: CalEvent[]
  onSelect: (d: Date) => void
}) {
  const [offset, setOffset] = useState(0)
  const month = new Date(selected.getFullYear(), selected.getMonth() + offset, 1)
  const first = startOfWeek(month)
  const cells = Array.from({ length: 42 }, (_, i) => addDays(first, i))
  const busy = new Set(events.map((e) => e.date))

  return (
    <section className={s.mini} aria-label="Mini calendar">
      <div className={s.miniHead}>
        <h2 className={s.miniTitle} aria-live="polite">
          {monthLabel(month)}
        </h2>
        <button type="button" className={s.iconBtn} aria-label="Previous month" onClick={() => setOffset(offset - 1)}>
          <ChevronLeft size={18} />
        </button>
        <button type="button" className={s.iconBtn} aria-label="Next month" onClick={() => setOffset(offset + 1)}>
          <ChevronRight size={18} />
        </button>
      </div>
      <div className={s.miniGrid}>
        {DOW.map((d, i) => (
          <span key={i} className={s.miniDow} aria-label={DOW_FULL[i]}>
            {d}
          </span>
        ))}
        {cells.map((d) => {
          const isToday = isSameDay(d, today)
          const isSel = isSameDay(d, selected)
          const out = d.getMonth() !== month.getMonth()
          return (
            <button
              key={toKey(d)}
              type="button"
              className={`${s.miniDay} ${out ? s.miniOut : ''} ${isToday ? s.miniToday : ''} ${isSel ? s.miniSelected : ''}`}
              aria-label={`${longDate(d)}${isToday ? ', today' : ''}${busy.has(toKey(d)) ? ', has events' : ''}`}
              aria-pressed={isSel}
              aria-current={isToday ? 'date' : undefined}
              onClick={() => onSelect(d)}
            >
              {d.getDate()}
              {busy.has(toKey(d)) && <i className={s.miniDot} aria-hidden="true" />}
            </button>
          )
        })}
      </div>
    </section>
  )
}
