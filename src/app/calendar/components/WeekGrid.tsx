'use client'

import { useEffect, useMemo, useRef, useState, type MouseEvent, type PointerEvent } from 'react'
import s from '../calendar.module.css'
import {
  HOUR_PX,
  addDays,
  fromKey,
  fromMin,
  gmtLabel,
  hourLabel,
  isSameDay,
  layoutDay,
  longDate,
  toKey,
  toMin,
  weekdayShort,
  type CalEvent,
} from '../lib'
import EventCard from './EventCard'

interface Props {
  weekStart: Date
  today: Date
  nowTs: number
  events: CalEvent[]
  highlightId: string | null
  focusReq: { minutes: number; n: number } | null
  onCreate: (date: string, start: string, end: string) => void
  onOpen: (id: string) => void
  onMove: (id: string, date: string, start: string, end: string) => void
}

const SNAP = 15
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))
const HOURS = Array.from({ length: 24 }, (_, h) => h)

export default function WeekGrid({ weekStart, today, nowTs, events, highlightId, focusReq, onCreate, onOpen, onMove }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const lastPointer = useRef<string>('mouse')
  const suppressClick = useRef(false)
  const [draft, setDraft] = useState<{ key: string; a: number; b: number } | null>(null)
  const [drag, setDrag] = useState<{ id: string; date: string; start: number; end: number } | null>(null)
  // Week-change transition: remember which way the user moved (1 = forward, -1 = back).
  const [weekMs, setWeekMs] = useState(weekStart.getTime())
  const [slide, setSlide] = useState<0 | 1 | -1>(0)
  if (weekMs !== weekStart.getTime()) {
    setSlide(weekStart.getTime() > weekMs ? 1 : -1)
    setWeekMs(weekStart.getTime())
  }

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])

  // Open around 7 AM so the working day is visible straight away.
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 7 * HOUR_PX - 14
  }, [])

  useEffect(() => {
    if (!focusReq || !scrollRef.current) return
    scrollRef.current.scrollTo({ top: Math.max(0, (focusReq.minutes / 60 - 1) * HOUR_PX), behavior: 'smooth' })
  }, [focusReq])

  const shown = drag
    ? events.map((e) => (e.id === drag.id ? { ...e, date: drag.date, start: fromMin(drag.start), end: fromMin(drag.end) } : e))
    : events

  const nowDate = new Date(nowTs)
  const nowMin = nowDate.getHours() * 60 + nowDate.getMinutes()

  /* ----- drag to create (mouse / pen). Touch uses a simple tap. ----- */
  const colPointerDown = (e: PointerEvent<HTMLDivElement>, key: string) => {
    lastPointer.current = e.pointerType
    if (e.pointerType === 'touch' || e.button !== 0 || e.target !== e.currentTarget) return
    const col = e.currentTarget
    const y0 = e.clientY
    const minuteAt = (y: number) => clamp(Math.floor(((y - col.getBoundingClientRect().top) / HOUR_PX) * 60 / SNAP) * SNAP, 0, 1425)
    const a = minuteAt(y0)
    let b = a
    let moved = false
    const move = (m: globalThis.PointerEvent) => {
      if (!moved && Math.abs(m.clientY - y0) < 5) return
      moved = true
      b = minuteAt(m.clientY)
      setDraft({ key, a, b })
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      setDraft(null)
      suppressClick.current = true
      if (moved) {
        onCreate(key, fromMin(Math.min(a, b)), fromMin(Math.min(Math.max(a, b) + SNAP, 1439)))
      } else {
        const st = Math.floor(a / 30) * 30
        onCreate(key, fromMin(st), fromMin(Math.min(st + 60, 1439)))
      }
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const colClick = (e: MouseEvent<HTMLDivElement>, key: string) => {
    if (suppressClick.current) {
      suppressClick.current = false
      return
    }
    if (lastPointer.current !== 'touch' || e.target !== e.currentTarget) return
    const y = e.clientY - e.currentTarget.getBoundingClientRect().top
    const st = clamp(Math.floor(((y / HOUR_PX) * 60) / 30) * 30, 0, 1380)
    onCreate(key, fromMin(st), fromMin(st + 60))
  }

  /* ----- drag to reschedule (mouse / pen) ----- */
  const eventPointerDown = (e: PointerEvent<HTMLButtonElement>, ev: CalEvent, dayIdx: number) => {
    lastPointer.current = e.pointerType
    if (e.pointerType === 'touch' || e.button !== 0) return
    const colW = e.currentTarget.parentElement?.getBoundingClientRect().width ?? 120
    const x0 = e.clientX
    const y0 = e.clientY
    const s0 = toMin(ev.start)
    const dur = toMin(ev.end) - s0
    const base = fromKey(ev.date)
    let moved = false
    let last: { date: string; start: number } | null = null
    const move = (m: globalThis.PointerEvent) => {
      const dx = m.clientX - x0
      const dy = m.clientY - y0
      if (!moved && Math.hypot(dx, dy) < 5) return
      moved = true
      const dd = clamp(Math.round(dx / colW), -dayIdx, 6 - dayIdx)
      const st = clamp(Math.round((s0 + (dy / HOUR_PX) * 60) / SNAP) * SNAP, 0, Math.max(0, 1439 - dur))
      last = { date: toKey(addDays(base, dd)), start: st }
      setDrag({ id: ev.id, date: last.date, start: st, end: st + dur })
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      setDrag(null)
      if (moved) {
        suppressClick.current = true
        if (last && (last.date !== ev.date || last.start !== s0)) onMove(ev.id, last.date, fromMin(last.start), fromMin(last.start + dur))
      }
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const openEvent = (id: string) => {
    if (suppressClick.current) {
      suppressClick.current = false
      return
    }
    onOpen(id)
  }

  return (
    <div className={s.scroll} ref={scrollRef} data-dragging={drag || draft ? 'true' : undefined}>
      <div
        className={`${s.gridInner} ${slide === 1 ? s.slideNext : slide === -1 ? s.slidePrev : ''}`}
        onAnimationEnd={(e) => {
          if (slide && e.animationName.includes('weekSlide')) setSlide(0)
        }}
      >
        <div className={s.corner}>{gmtLabel(nowTs)}</div>
        {days.map((d) => {
          const isToday = isSameDay(d, today)
          return (
            <div key={toKey(d)} className={s.dayHead} aria-current={isToday ? 'date' : undefined}>
              <span className={`${s.dayName} ${isToday ? s.dayNameToday : ''}`}>{weekdayShort(d)}</span>
              <span className={`${s.dayNum} ${isToday ? s.dayNumToday : ''}`}>{d.getDate()}</span>
            </div>
          )
        })}

        <div className={s.timeCol} aria-hidden="true">
          {HOURS.slice(1).map((h) => (
            <span key={h} className={s.hourLabel} style={{ top: h * HOUR_PX }}>
              {hourLabel(h)}
            </span>
          ))}
        </div>

        {days.map((d, i) => {
          const key = toKey(d)
          const isToday = isSameDay(d, today)
          const laid = layoutDay(shown.filter((e) => e.date === key))
          return (
            <div
              key={key}
              role="group"
              aria-label={longDate(d)}
              className={`${s.dayCol} ${isToday ? s.dayColToday : ''}`}
              onPointerDown={(e) => colPointerDown(e, key)}
              onClick={(e) => colClick(e, key)}
            >
              {laid.map(({ ev, col, cols }) => {
                const st = toMin(ev.start)
                const en = Math.max(toMin(ev.end), st + 15)
                return (
                  <EventCard
                    key={ev.id}
                    ev={ev}
                    top={(st / 60) * HOUR_PX}
                    height={Math.max(((en - st) / 60) * HOUR_PX - 2, 20)}
                    col={col}
                    cols={cols}
                    highlight={highlightId === ev.id}
                    dragging={drag?.id === ev.id}
                    onClick={() => openEvent(ev.id)}
                    onPointerDown={(e) => eventPointerDown(e, events.find((x) => x.id === ev.id) ?? ev, i)}
                  />
                )
              })}
              {draft && draft.key === key && (
                <div
                  className={s.draft}
                  style={{
                    top: (Math.min(draft.a, draft.b) / 60) * HOUR_PX,
                    height: ((Math.abs(draft.b - draft.a) + SNAP) / 60) * HOUR_PX,
                  }}
                />
              )}
              {isToday && <div className={s.nowLine} style={{ top: (nowMin / 60) * HOUR_PX }} aria-hidden="true" />}
            </div>
          )
        })}
      </div>
    </div>
  )
}
