'use client'

import type { CSSProperties, PointerEvent } from 'react'
import s from '../calendar.module.css'
import { fmtRange, type CalEvent } from '../lib'

interface Props {
  ev: CalEvent
  top: number
  height: number
  col: number
  cols: number
  highlight: boolean
  dragging: boolean
  onClick: () => void
  onPointerDown: (e: PointerEvent<HTMLButtonElement>) => void
}

export default function EventCard({ ev, top, height, col, cols, highlight, dragging, onClick, onPointerDown }: Props) {
  const style: CSSProperties = {
    top,
    height,
    left: `calc(${(col / cols) * 100}% + 2px)`,
    width: `calc(${100 / cols}% - 5px)`,
  }
  const compact = height < 44
  const range = fmtRange(ev.start, ev.end)
  return (
    <button
      type="button"
      className={`${s.event} ${s['ev_' + ev.color]} ${highlight ? s.eventHighlight : ''} ${dragging ? s.eventDragging : ''}`}
      style={style}
      onClick={onClick}
      onPointerDown={onPointerDown}
      aria-label={`${ev.title}, ${range}`}
    >
      {compact ? (
        <span className={s.eventLine}>
          <strong>{ev.title}</strong>
          <span>{range}</span>
        </span>
      ) : (
        <>
          <strong className={s.eventTitle}>{ev.title}</strong>
          <span className={s.eventTime}>{range}</span>
          {height >= 84 && ev.description && <span className={s.eventDesc}>{ev.description}</span>}
        </>
      )}
    </button>
  )
}
