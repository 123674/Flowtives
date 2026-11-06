'use client'

import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import s from '../calendar.module.css'
import {
  HOUR_PX,
  addDays,
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
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))
const HOURS = Array.from({ length: 24 }, (_, h) => h)

export default function WeekGrid({ weekStart, today, nowTs, events, highlightId, focusReq, onCreate, onOpen }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
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

  const nowDate = new Date(nowTs)
  const nowMin = nowDate.getHours() * 60 + nowDate.getMinutes()

  const colClick = (e: MouseEvent<HTMLDivElement>, key: string) => {
    if (e.target !== e.currentTarget) return
    const y = e.clientY - e.currentTarget.getBoundingClientRect().top
    const st = clamp(Math.floor(((y / HOUR_PX) * 60) / 30) * 30, 0, 1380)
    onCreate(key, fromMin(st), fromMin(st + 60))
  }

  const openEvent = (id: string) => {
    onOpen(id)
  }

  return (
    <div className={s.scroll} ref={scrollRef}>
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

        {days.map((d) => {
          const key = toKey(d)
          const isToday = isSameDay(d, today)
          const laid = layoutDay(events.filter((e) => e.date === key))
          return (
            <div
              key={key}
              role="group"
              aria-label={longDate(d)}
              className={`${s.dayCol} ${isToday ? s.dayColToday : ''}`}
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
                    onClick={() => openEvent(ev.id)}
                  />
                )
              })}
              {isToday && <div className={s.nowLine} style={{ top: (nowMin / 60) * HOUR_PX }} aria-hidden="true" />}
            </div>
          )
        })}
      </div>
    </div>
  )
}
