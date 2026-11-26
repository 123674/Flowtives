'use client'

import { useState, type FormEvent } from 'react'
import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react'
import { categoryColor, compareWeeks, formatPercentChange, TIME_SLOTS, type AnalyticsEvent, type Category, type WeekSummary } from '../../../../lib/analytics'
import { addDays, shortDate, toKey, weekdayShort } from '../../../calendar/lib'
import Link from 'next/link'
import styles from '../../../calendar/calendar.module.css'

const COLORS: Record<string, string> = {
  lavender: '#7b6df0',
  mint: '#3f9c80',
  blue: '#5b8fdc',
  peach: '#ec9a70',
}

function formatDuration(minutes: number) {
  const value = Math.round(minutes)
  const hours = Math.floor(value / 60)
  const mins = value % 60
  if (!hours) return `${mins}m`
  if (!mins) return `${hours}h`
  return `${hours}h ${String(mins).padStart(2, '0')}m`
}

function Change({ difference, baseline }: { difference: number; baseline: number }) {
  const rounded = Math.round(difference)
  const Icon = rounded > 0 ? ArrowUpRight : rounded < 0 ? ArrowDownRight : ArrowRight
  const sign = rounded > 0 ? '+' : rounded < 0 ? '−' : ''
  const percentage = formatPercentChange(rounded, baseline)
  return <span className={styles['an-delta']}><Icon size={14} aria-hidden="true" />{sign}{formatDuration(Math.abs(rounded))} · {percentage}</span>
}

function CategoryBreakdown({ current, compared, compareEnabled }: { current: WeekSummary; compared: WeekSummary; compareEnabled: boolean }) {
  const comparedTotal = compared.totalMinutes
  const currentTotal = current.totalMinutes
  const categories = [...current.categories].sort((a, b) => current.minutesByCategory[b] - current.minutesByCategory[a] || a.localeCompare(b))
  const differences = compareWeeks(current, compared)

  return (
    <section className={`${styles['an-card']} ${styles['an-timeCard']}`} aria-labelledby="an-category-heading">
      <div className={styles['an-sectionHead']}>
        <div><h2 id="an-category-heading">Time by category</h2><p>How your planned hours are distributed</p></div>
      </div>
      <div className={styles['an-categoryList']}>
        {categories.map((category) => {
          const minutes = current.minutesByCategory[category]
          const comparedMinutes = compared.minutesByCategory[category] ?? 0
          const color = COLORS[categoryColor(category)]
          return (
            <div className={styles['an-categoryRow']} key={category}>
              <span className={styles['an-categoryName']}><i style={{ backgroundColor: color }} />{category}</span>
              <span className={styles['an-categoryValue']}>{formatDuration(minutes)}</span>
              <span className={styles['an-categoryShare']}>{currentTotal ? `${Math.round(minutes / currentTotal * 100)}%` : '0%'}</span>
              <div className={styles['an-categoryBars']} aria-label={`${category}: this week ${formatDuration(minutes)}${compareEnabled ? `, compared week ${formatDuration(comparedMinutes)}` : ''}`}>
                <span className={styles['an-categoryBar']} style={{ width: `${currentTotal ? minutes / currentTotal * 100 : 0}%`, backgroundColor: color }} />
                {compareEnabled && <span className={`${styles['an-categoryBar']} ${styles['an-categoryBarCompare']}`} style={{ width: `${comparedTotal ? comparedMinutes / comparedTotal * 100 : 0}%`, borderColor: color }} />}
              </div>
              {compareEnabled && <Change difference={differences.minutesByCategory[category]} baseline={comparedMinutes} />}
            </div>
          )
        })}
      </div>
      {compareEnabled && <p className={styles['an-chartHint']}>Solid bars show this week; outlined bars show the comparison week.</p>}
    </section>
  )
}

function Insights({ current, compared, compareEnabled }: { current: WeekSummary; compared: WeekSummary; compareEnabled: boolean }) {
  const comparison = compareWeeks(current, compared)
  const studyDays = current.days.filter((day) => day.minutesByCategory.Study > 0).length
  let insight: string
  if (compareEnabled && comparison.studyMinutes !== 0) {
    const direction = comparison.studyMinutes > 0 ? 'up' : 'down'
    insight = `Your study plans are ${direction} ${formatDuration(Math.abs(comparison.studyMinutes))} compared with the week you selected.`
  } else if (current.minutesByCategory.Study > 0) {
    insight = `You’ve set aside ${formatDuration(current.minutesByCategory.Study)} for study across ${studyDays} day${studyDays === 1 ? '' : 's'} this week.`
  } else if (current.totalMinutes > 0 && current.minutesByCategory['Meals and breaks'] === 0) {
    insight = 'Your calendar is filling up. Consider adding a little space for breaks and downtime.'
  } else if (current.totalMinutes > 0) {
    insight = 'Your plans are taking shape. Add a study session whenever you’re ready.'
  } else {
    insight = 'A little planning can make the week feel more manageable. Start with one thing you want to make time for.'
  }
  const busiest = [...current.days].sort((a, b) => b.totalMinutes - a.totalMinutes)[0]
  const nextWeek = addDays(current.start, 7)
  return (
    <section className={styles['an-insightCard']} aria-labelledby="an-insights-heading">
      <div className={styles['an-insightCopy']}>
        <span className={styles['an-insightEyebrow']}>A note for your week</span>
        <h2 id="an-insights-heading">Make space for what matters.</h2>
        <p>{insight}</p>
        {busiest && busiest.totalMinutes > 0 && (
          <p className={styles['an-insightDetail']}>
            {busiest.date.toLocaleDateString('en-US', { weekday: 'long' })} is your busiest day, with {formatDuration(busiest.totalMinutes)} planned.
            {current.overlaps > 0 && ` ${current.overlaps} overlapping event${current.overlaps === 1 ? ' was' : 's were'} excluded from the totals.`}
          </p>
        )}
      </div>
      <Link className={styles['an-insightAction']} href={`/calendar?week=${toKey(nextWeek)}`}>Plan next week <ArrowRight size={16} aria-hidden="true" /></Link>
    </section>
  )
}

function StudyConsistency({ current }: { current: WeekSummary }) {
  const maximum = Math.max(0, ...current.days.map((day) => day.minutesByCategory.Study))
  return (
    <section className={`${styles['an-card']} ${styles['an-consistencyCard']}`} aria-labelledby="an-consistency-heading">
      <div className={styles['an-sectionHead']}>
        <div><h2 id="an-consistency-heading">Study consistency</h2><p>Planned study time, day by day</p></div>
      </div>
      <div className={styles['an-consistencyGrid']}>
        {current.days.map((day) => {
          const minutes = day.minutesByCategory.Study
          const level = maximum === 0 || minutes === 0 ? 0 : Math.max(1, Math.ceil(minutes / maximum * 4))
          return (
            <div className={styles['an-consistencyDay']} key={toKey(day.date)}>
              <span>{weekdayShort(day.date)}</span>
              <i className={styles[`an-consistencyLevel${level}`]} aria-label={`${weekdayShort(day.date)}: ${formatDuration(minutes)} of study planned`} />
              <small>{minutes > 0 ? formatDuration(minutes) : '—'}</small>
            </div>
          )
        })}
      </div>
      <p className={styles['an-consistencyNote']}>Consistency is based on scheduled study events, not completed sessions.</p>
    </section>
  )
}

function CategoryTable({ current, compared, compareEnabled }: { current: WeekSummary; compared: WeekSummary; compareEnabled: boolean }) {
  const difference = compareWeeks(current, compared)
  const categories = [...current.categories].sort((a, b) => current.minutesByCategory[b] - current.minutesByCategory[a] || a.localeCompare(b))
  return (
    <section className={styles['an-card']} aria-labelledby="an-table-heading">
      <div className={styles['an-sectionHead']}><div><h2 id="an-table-heading">Category details</h2><p>Accessible totals for this week and the comparison week</p></div></div>
      <div className={styles['an-tableWrap']}>
        <table className={styles['an-table']}>
          <thead><tr><th scope="col">Category</th><th scope="col">This week</th><th scope="col">Compared week</th><th scope="col">Change</th></tr></thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category}>
                <th scope="row"><span className={styles['an-tableCategory']}><i style={{ backgroundColor: COLORS[categoryColor(category)] }} />{category}</span></th>
                <td>{formatDuration(current.minutesByCategory[category])}</td>
                <td>{compareEnabled ? formatDuration(compared.minutesByCategory[category] ?? 0) : '—'}</td>
                <td>{compareEnabled ? <Change difference={difference.minutesByCategory[category] ?? 0} baseline={compared.minutesByCategory[category] ?? 0} /> : '—'}</td>
              </tr>
            ))}
            <tr className={styles['an-totalRow']}><th scope="row">Total timed</th><td>{formatDuration(current.totalMinutes)}</td><td>{compareEnabled ? formatDuration(compared.totalMinutes) : '—'}</td><td>{compareEnabled ? <Change difference={difference.totalMinutes} baseline={compared.totalMinutes} /> : '—'}</td></tr>
          </tbody>
        </table>
      </div>
      <div className={styles['an-srOnly']}>
        <table>
          <caption>Daily scheduled hours by category, for the current week</caption>
          <thead><tr><th scope="col">Day</th><th scope="col">Category</th><th scope="col">Hours</th></tr></thead>
          <tbody>{current.days.flatMap((day) => current.categories.map((category) => (
            <tr key={`${toKey(day.date)}-${category}`}>
              <th scope="row">{weekdayShort(day.date)}, {toKey(day.date)}</th>
              <td>{category}</td>
              <td>{formatDuration(day.minutesByCategory[category])}</td>
            </tr>
          )))}</tbody>
        </table>
        <table>
          <caption>Scheduled hours by day and time of day, for the current week</caption>
          <thead><tr><th scope="col">Day</th>{TIME_SLOTS.map((slot) => <th key={slot} scope="col">{slot}</th>)}</tr></thead>
          <tbody>{current.days.map((day) => (
            <tr key={toKey(day.date)}>
              <th scope="row">{weekdayShort(day.date)}, {toKey(day.date)}</th>
              {TIME_SLOTS.map((slot) => <td key={slot}>{formatDuration(day.minutesByTimeSlot[slot])}</td>)}
            </tr>
          ))}</tbody>
        </table>
      </div>
    </section>
  )
}

export function AnalyticsCategoryManager({ events, categories, categoryOf, onChange, onCreate, message }: {
  events: readonly AnalyticsEvent[]
  categories: readonly Category[]
  categoryOf: (event: AnalyticsEvent) => Category
  onChange: (eventId: string, category: Category) => void
  onCreate: (category: string) => string | null
  message: string
}) {
  const [name, setName] = useState('')
  const [feedback, setFeedback] = useState('')

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const category = name.trim()
    if (!category) {
      setFeedback('Enter a category name.')
      return
    }
    if (category.length > 32) {
      setFeedback('Category names must be 32 characters or fewer.')
      return
    }
    if (categories.some((existing) => existing.toLowerCase() === category.toLowerCase())) {
      setFeedback('That category already exists.')
      return
    }
    const error = onCreate(category)
    if (error) {
      setFeedback(error)
      return
    }
    setName('')
    setFeedback(`${category} created.`)
  }

  return (
    <details className={`${styles['an-details']} ${styles['an-categoryDetails']}`}>
      <summary>Manage categories</summary>
      <section className={`${styles['an-card']} ${styles['an-categoryManager']}`} aria-labelledby="an-overrides-heading">
        <div className={styles['an-sectionHead']}><div><h2 id="an-overrides-heading">Your categories</h2><p>Create categories and assign them to events in this week.</p></div></div>
        <form className={styles['an-createCategory']} onSubmit={submit}>
          <label htmlFor="an-category-name">New category</label>
          <input id="an-category-name" value={name} maxLength={32} placeholder="e.g. Volunteering" onChange={(event) => setName(event.currentTarget.value)} />
          <button type="submit">Add category</button>
        </form>
        {(message || feedback) && <p className={styles['an-categoryMessage']} role="status">{message || feedback}</p>}
        {events.length === 0 ? (
          <p className={styles['an-categoryEmpty']}>No events this week to categorize yet.</p>
        ) : (
          <ul className={styles['an-eventList']}>
            {events.map((event) => (
              <li key={event.id}>
                <span className={styles['an-eventText']}><strong>{event.title}</strong><small>{shortDate(new Date(`${event.date}T12:00:00`))}</small></span>
                <label>
                  <span className={styles['an-srOnly']}>Category for {event.title}</span>
                  <select value={categoryOf(event)} onChange={(change) => onChange(event.id, change.currentTarget.value)}>
                    {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                  </select>
                </label>
              </li>
            ))}
          </ul>
        )}
      </section>
    </details>
  )
}

export default function AnalyticsSections({
  current,
  compared,
  compareEnabled,
}: {
  current: WeekSummary
  compared: WeekSummary
  compareEnabled: boolean
}) {
  return (
    <div className={styles['an-lowerGrid']}>
      <StudyConsistency current={current} />
      <CategoryBreakdown current={current} compared={compared} compareEnabled={compareEnabled} />
      <Insights current={current} compared={compared} compareEnabled={compareEnabled} />
      <details className={styles['an-details']}>
        <summary>Detailed breakdown</summary>
        <div className={styles['an-detailGrid']}>
          <CategoryTable current={current} compared={compared} compareEnabled={compareEnabled} />
        </div>
      </details>
    </div>
  )
}
