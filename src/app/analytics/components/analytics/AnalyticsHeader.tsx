'use client'

import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { addDays, toKey } from '../../../calendar/lib'
import styles from '../../../calendar/calendar.module.css'

interface Props {
  week: Date
  compareWeek: Date
  compareEnabled: boolean
  sameWeekMessage: string
  onWeekChange: (date: Date) => void
  onCompareWeekChange: (date: Date) => void
  onCompareToggle: (enabled: boolean) => void
  onThisWeek: () => void
}

function parseDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null
}

function rangeLabel(week: Date) {
  const end = addDays(week, 6)
  const startLabel = week.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(week.getFullYear() === end.getFullYear() ? {} : { year: 'numeric' }),
  })
  const endLabel = end.toLocaleDateString('en-US', {
    ...(week.getMonth() === end.getMonth() ? {} : { month: 'short' }),
    day: 'numeric',
    year: 'numeric',
  })
  return `${startLabel} – ${endLabel}`
}

export default function AnalyticsHeader({
  week,
  compareWeek,
  compareEnabled,
  sameWeekMessage,
  onWeekChange,
  onCompareWeekChange,
  onCompareToggle,
  onThisWeek,
}: Props) {
  return (
    <>
      <header className={`${styles.toolbar} ${styles['an-topbar']}`}>
        <Link href="/" className={styles.wordmark} aria-label="Flowtives home">Flowtives</Link>
        <nav className={styles.pageNav} aria-label="Main navigation">
          <Link href={`/calendar?week=${toKey(week)}`}>Calendar</Link>
          <span aria-current="page">Analytics</span>
        </nav>
      </header>
      <header className={styles['an-header']}>
        <div className={styles['an-heading']}>
          <Link className={styles['an-back']} href={`/calendar?week=${toKey(week)}`}>
            <ArrowLeft size={16} aria-hidden="true" />
            Your overview
          </Link>
          <h1>Your week, in focus.</h1>
        </div>
        <div className={styles['an-headerControls']}>
          <nav className={styles['an-weekNav']} aria-label="Analytics week navigation">
            <button type="button" className={styles['an-iconBtn']} aria-label="Previous week" onClick={() => onWeekChange(addDays(week, -7))}>
              <ChevronLeft size={18} />
            </button>
            <span className={styles['an-dateRange']} aria-live="polite">{rangeLabel(week)}</span>
            <button type="button" className={styles['an-iconBtn']} aria-label="Next week" onClick={() => onWeekChange(addDays(week, 7))}>
              <ChevronRight size={18} />
            </button>
            <button type="button" className={styles['an-today']} onClick={onThisWeek}>This week</button>
          </nav>
          <label className={styles['an-compareToggle']}>
            <input type="checkbox" checked={compareEnabled} onChange={(event) => onCompareToggle(event.currentTarget.checked)} />
            Compare
          </label>
        </div>
      </header>

      {compareEnabled && (
        <section className={styles['an-comparePicker']} aria-label="Compare with another week">
          <span>Compare with</span>
          <button type="button" className={styles['an-iconBtn']} aria-label="Previous comparison week" onClick={() => onCompareWeekChange(addDays(compareWeek, -7))}>
            <ChevronLeft size={18} />
          </button>
          <input
            type="date"
            aria-label="Comparison week date"
            value={toKey(compareWeek)}
            onChange={(event) => {
              const date = parseDate(event.currentTarget.value)
              if (date) onCompareWeekChange(date)
            }}
          />
          <button type="button" className={styles['an-iconBtn']} aria-label="Next comparison week" onClick={() => onCompareWeekChange(addDays(compareWeek, 7))}>
            <ChevronRight size={18} />
          </button>
          {sameWeekMessage && <span className={styles['an-inlineMessage']} role="status">{sameWeekMessage}</span>}
        </section>
      )}
    </>
  )
}
