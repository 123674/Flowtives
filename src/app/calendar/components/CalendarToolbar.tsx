'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Menu, Search, X } from 'lucide-react'
import s from '../calendar.module.css'
import { fmtRange, fromKey, shortDate, weekLabel, type CalEvent } from '../lib'

interface Props {
  weekStart: Date
  events: CalEvent[]
  onMenu: () => void
  onToday: () => void
  onShift: (weeks: number) => void
  onPick: (ev: CalEvent) => void
}

export default function CalendarToolbar({ weekStart, events, onMenu, onToday, onShift, onPick }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const q = query.trim().toLowerCase()
  const results = q
    ? events
        .filter((e) => e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q))
        .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))
        .slice(0, 30)
    : []

  const close = () => {
    setOpen(false)
    setQuery('')
  }

  return (
    <header className={s.toolbar}>
      <button type="button" className={`${s.iconBtn} ${s.menuBtn}`} aria-label="Open mini calendar" aria-controls="calendar-sidebar" onClick={onMenu}>
        <Menu size={20} />
      </button>
      <Link href="/" className={s.wordmark} aria-label="Flowtives home">
        Flowtives
      </Link>
      <button type="button" className={s.todayBtn} onClick={onToday}>
        Today
      </button>
      <div className={s.navBtns}>
        <button type="button" className={s.iconBtn} aria-label="Previous week" onClick={() => onShift(-1)}>
          <ChevronLeft size={20} />
        </button>
        <button type="button" className={s.iconBtn} aria-label="Next week" onClick={() => onShift(1)}>
          <ChevronRight size={20} />
        </button>
      </div>
      <h1 className={s.monthTitle} aria-live="polite">
        {weekLabel(weekStart)}
      </h1>

      <div
        className={`${s.search} ${open ? s.searchOpen : ''}`}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) close()
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') close()
        }}
      >
        {open ? (
          <div className={s.searchBox} role="search">
            <Search size={17} aria-hidden="true" />
            <input
              ref={inputRef}
              type="search"
              aria-label="Search events"
              placeholder="Search events"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="button" className={s.iconBtn} aria-label="Close search" onClick={close}>
              <X size={16} />
            </button>
          </div>
        ) : (
          <button type="button" className={s.iconBtn} aria-label="Search events" aria-expanded="false" onClick={() => setOpen(true)}>
            <Search size={19} />
          </button>
        )}

        {open && (
          <div className={s.results} onMouseDown={(e) => e.preventDefault()}>
            <p className={s.srOnly} role="status">
              {q ? `${results.length} matching events` : ''}
            </p>
            {!q && <p className={s.resultsEmpty}>Search by event title or description.</p>}
            {q && results.length === 0 && <p className={s.resultsEmpty}>No events match “{query.trim()}”.</p>}
            {results.length > 0 && (
              <ul>
                {results.map((ev) => (
                  <li key={ev.id}>
                    <button
                      type="button"
                      className={`${s.result} ${s['ev_' + ev.color]}`}
                      onClick={() => {
                        onPick(ev)
                        close()
                      }}
                    >
                      <span className={s.resultDot} aria-hidden="true" />
                      <span className={s.resultText}>
                        <strong>{ev.title}</strong>
                        <small>
                          {shortDate(fromKey(ev.date))} · {fmtRange(ev.start, ev.end)}
                        </small>
                        {ev.description && <small className={s.resultDesc}>{ev.description}</small>}
                      </span>
                      <span className={s.resultGo}>Go to date</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
