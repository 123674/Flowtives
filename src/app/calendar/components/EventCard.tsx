'use client'

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type FocusEvent, type PointerEvent } from 'react'
import { createPortal } from 'react-dom'
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

  /* ----- hover / keyboard-focus tooltip (never used for touch) ----- */
  const tipId = useId()
  const btnRef = useRef<HTMLButtonElement>(null)
  const tipRef = useRef<HTMLDivElement>(null)
  const timer = useRef<number | null>(null)
  const [tipOpen, setTipOpen] = useState(false)

  const clearTimer = () => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current)
      timer.current = null
    }
  }
  const hideTip = useCallback(() => {
    clearTimer()
    setTipOpen(false)
  }, [])

  useEffect(() => clearTimer, [])

  // Place the tooltip (fixed, so the card and grid can't clip it): above, else below, else beside.
  useLayoutEffect(() => {
    const tip = tipRef.current
    const btn = btnRef.current
    if (!tipOpen || !tip || !btn) return
    const r = btn.getBoundingClientRect()
    const w = tip.offsetWidth
    const h = tip.offsetHeight
    const vw = document.documentElement.clientWidth
    const vh = window.innerHeight
    const M = 8
    const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))
    let left = clamp(r.left + r.width / 2 - w / 2, M, vw - w - M)
    let top = r.top - h - 8
    if (top < M) top = r.bottom + 8
    if (top + h > vh - M) {
      // no room above or below (tall card near an edge): go beside it
      left = r.right + 8 + w <= vw - M ? r.right + 8 : Math.max(M, r.left - w - 8)
      top = clamp(r.top, M, vh - h - M)
    }
    tip.style.left = `${left}px`
    tip.style.top = `${top}px`
    tip.style.visibility = 'visible'
  }, [tipOpen])

  // Dismiss on Escape, or when the grid scrolls / window resizes (the fixed tooltip would drift).
  useEffect(() => {
    if (!tipOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') hideTip()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('scroll', hideTip, true)
    window.addEventListener('resize', hideTip)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', hideTip, true)
      window.removeEventListener('resize', hideTip)
    }
  }, [tipOpen, hideTip])

  const onEnter = (e: PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType === 'touch' || dragging) return
    clearTimer()
    timer.current = window.setTimeout(() => setTipOpen(true), 250)
  }
  const onFocus = (e: FocusEvent<HTMLButtonElement>) => {
    if (e.currentTarget.matches(':focus-visible')) setTipOpen(true)
  }

  return (
    <>
    <button
      ref={btnRef}
      type="button"
      className={`${s.event} ${s['ev_' + ev.color]} ${highlight ? s.eventHighlight : ''} ${dragging ? s.eventDragging : ''}`}
      style={style}
      onClick={() => {
        hideTip()
        onClick()
      }}
      onPointerDown={(e) => {
        hideTip()
        onPointerDown(e)
      }}
      onPointerEnter={onEnter}
      onPointerLeave={hideTip}
      onFocus={onFocus}
      onBlur={hideTip}
      aria-label={`${ev.title}, ${range}`}
      aria-describedby={tipOpen ? tipId : undefined}
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
    {tipOpen &&
      createPortal(
        <div ref={tipRef} id={tipId} role="tooltip" className={s.eventTip}>
          <strong>{ev.title}</strong>
          <span>{range}</span>
          {ev.description && <p>{ev.description}</p>}
        </div>,
        document.body,
      )}
    </>
  )
}
