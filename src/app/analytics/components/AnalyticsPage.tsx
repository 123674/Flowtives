'use client'

import { useCallback, useMemo, useState, useSyncExternalStore } from 'react'
import { addDays, startOfWeek, toKey } from '../../calendar/lib'
import Link from 'next/link'
import { eventStore } from '../../calendar/store'
import {
  categorise,
  CATEGORIES,
  summariseWeek,
  type AnalyticsEvent,
  type Category,
  type WeekSummary,
} from '../../../lib/analytics'
import calendarStyles from '../../calendar/calendar.module.css'
import AnalyticsHeader from './analytics/AnalyticsHeader'
import AnalyticsCharts from './analytics/AnalyticsCharts'
import AnalyticsSections, { AnalyticsCategoryManager } from './analytics/AnalyticsSections'
import type { CategoryOverrides } from './analytics/types'

const CUSTOM_CATEGORIES_KEY = 'flowtives.analytics.customCategories.v1'

function parseDate(value: string | null): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null
}

function parseCustomCategories(serialized: string | null): string[] {
  if (!serialized) return []
  const parsed: unknown = JSON.parse(serialized)
  if (!Array.isArray(parsed)) throw new Error('Saved custom categories are not a list.')

  const existing = new Set<string>(CATEGORIES.map((category) => category.toLowerCase()))
  const categories: string[] = []
  for (const value of parsed) {
    if (typeof value !== 'string') continue
    const category = value.trim()
    const normalized = category.toLowerCase()
    if (category && category.length <= 32 && !existing.has(normalized)) {
      existing.add(normalized)
      categories.push(category)
    }
  }
  return categories
}

function readStoredCategories(): { categories: string[]; message: string } {
  if (typeof window === 'undefined') return { categories: [], message: '' }
  try {
    return {
      categories: parseCustomCategories(window.localStorage.getItem(CUSTOM_CATEGORIES_KEY)),
      message: '',
    }
  } catch (error) {
    console.error('Could not load custom analytics categories.', error)
    return { categories: [], message: 'Saved custom categories could not be loaded from this browser.' }
  }
}

function weekFromParam(value: string | null, fallback: Date): Date {
  const parsed = parseDate(value)
  return startOfWeek(parsed ?? fallback)
}

function readUrl(search: string, fallback: Date) {
  const params = new URLSearchParams(search)
  const week = weekFromParam(params.get('week'), fallback)
  const rawCompareParam = params.get('compare')
  const rawCompare = parseDate(rawCompareParam)
  const compare = startOfWeek(rawCompare ?? addDays(week, -7))
  const compareEnabled = rawCompareParam !== null && rawCompare !== null
  return { week, compare: compare.getTime() === week.getTime() ? addDays(week, -7) : compare, compareEnabled }
}

function subscribeUrl(callback: () => void) {
  window.addEventListener('popstate', callback)
  window.addEventListener('flowtives-urlchange', callback)
  return () => {
    window.removeEventListener('popstate', callback)
    window.removeEventListener('flowtives-urlchange', callback)
  }
}

function getUrlSnapshot() {
  return window.location.search
}

function LoadingView() {
  return (
    <main className={`${calendarStyles['an-root']} ${calendarStyles['an-loading']}`} aria-busy="true" aria-label="Loading weekly analytics">
      <div className={calendarStyles['an-skeletonHead']} />
      <div className={calendarStyles['an-skeletonCards']}>{Array.from({ length: 4 }, (_, index) => <div key={index} className={calendarStyles['an-skeletonCard']} />)}</div>
      <div className={calendarStyles['an-skeletonPanel']} />
    </main>
  )
}

export default function AnalyticsPage() {
  const events = useSyncExternalStore(eventStore.subscribe, eventStore.getSnapshot, eventStore.getServerSnapshot)
  const eventsReady = events !== eventStore.getServerSnapshot()
  const search = useSyncExternalStore(subscribeUrl, getUrlSnapshot, () => null)
  const [sameWeekMessage, setSameWeekMessage] = useState('')
  const [overrides, setOverrides] = useState<CategoryOverrides>({})
  const [storedCategories] = useState(readStoredCategories)
  const [customCategories, setCustomCategories] = useState(storedCategories.categories)
  const [categoryMessage, setCategoryMessage] = useState(storedCategories.message)
  const selection = useMemo(() => search === null ? null : readUrl(search, new Date()), [search])
  const week = selection?.week ?? null
  const compareWeek = selection?.compare ?? null
  const compareEnabled = selection?.compareEnabled ?? false

  const categories = useMemo(() => [...CATEGORIES, ...customCategories], [customCategories])

  const saveSelection = useCallback((nextWeek: Date, enabled: boolean, nextCompare: Date) => {
    const params = new URLSearchParams()
    params.set('week', toKey(nextWeek))
    if (enabled) params.set('compare', toKey(nextCompare))
    window.history.pushState(null, '', `/analytics?${params.toString()}`)
    window.dispatchEvent(new Event('flowtives-urlchange'))
  }, [])

  const changeWeek = (next: Date) => {
    const normalized = startOfWeek(next)
    const compare = compareWeek && compareWeek.getTime() !== normalized.getTime() ? compareWeek : addDays(normalized, -7)
    setSameWeekMessage('')
    saveSelection(normalized, compareEnabled, compare)
  }

  const changeCompareWeek = (next: Date) => {
    if (!week) return
    const normalized = startOfWeek(next)
    if (normalized.getTime() === week.getTime()) {
      setSameWeekMessage('Choose a different week to compare.')
      return
    }
    setSameWeekMessage('')
    saveSelection(week, true, normalized)
  }

  const toggleCompare = (enabled: boolean) => {
    if (!week || !compareWeek) return
    setSameWeekMessage('')
    saveSelection(week, enabled, compareWeek)
  }

  const today = () => {
    const next = startOfWeek(new Date())
    const compare = compareWeek?.getTime() === next.getTime() ? addDays(next, -7) : compareWeek ?? addDays(next, -7)
    setSameWeekMessage('')
    saveSelection(next, compareEnabled, compare)
  }

  const currentCategory = useCallback((event: AnalyticsEvent): Category => {
    const override = overrides[event.id]
    return override && categories.includes(override) ? override : categorise(event)
  }, [categories, overrides])
  const current: WeekSummary | null = useMemo(
    () => week ? summariseWeek(events, week, currentCategory, categories) : null,
    [events, week, currentCategory, categories],
  )
  const compared: WeekSummary | null = useMemo(
    () => compareWeek ? summariseWeek(events, compareWeek, currentCategory, categories) : null,
    [events, compareWeek, currentCategory, categories],
  )

  if (search === null || !eventsReady || !week || !compareWeek || !current || !compared) return <LoadingView />

  const updateCategory = (eventId: string, category: Category) => {
    // TODO(me): persist overrides in backend
    setOverrides((previous) => ({ ...previous, [eventId]: category }))
  }
  const addCategory = (value: string): string | null => {
    const category = value.trim()
    if (!category) return 'Enter a category name.'
    if (category.length > 32) return 'Category names must be 32 characters or fewer.'
    if (categories.some((existing) => existing.toLowerCase() === category.toLowerCase())) return 'That category already exists.'

    const nextCategories = [...customCategories, category]
    try {
      window.localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(nextCategories))
    } catch (error) {
      console.error('Could not save custom analytics category.', error)
      const message = 'This category could not be saved in this browser.'
      setCategoryMessage(message)
      return message
    }
    setCustomCategories(nextCategories)
    setCategoryMessage('')
    return null
  }
  const visibleEvents = events.filter((event) => {
    if (!event || typeof event.id !== 'string' || typeof event.title !== 'string' || typeof event.date !== 'string' ||
      typeof event.description !== 'string' || !['lavender', 'mint', 'blue', 'peach'].includes(event.color)) return false
    const eventDate = parseDate(event.date)
    return eventDate !== null && eventDate.getTime() >= week.getTime() && eventDate.getTime() <= addDays(week, 6).getTime()
  })

  return (
    <main className={`${calendarStyles['an-root']} flowtives-calendar`}>
      <AnalyticsHeader
        week={week}
        compareWeek={compareWeek}
        compareEnabled={compareEnabled}
        sameWeekMessage={sameWeekMessage}
        onWeekChange={changeWeek}
        onCompareWeekChange={changeCompareWeek}
        onCompareToggle={toggleCompare}
        onThisWeek={today}
      />

      {current.invalidCount > 0 && (
        <p className={calendarStyles['an-inlineMessage']} role="status">
          {current.invalidCount} event{current.invalidCount === 1 ? '' : 's'} could not be included because their date or time is invalid.
        </p>
      )}
      {current.totalMinutes === 0 && current.allDayCount === 0 ? (
        <section className={calendarStyles['an-empty']} aria-labelledby="an-empty-heading">
          <h2 id="an-empty-heading">Nothing planned this week yet.</h2>
          <p>When you add events to your calendar, your weekly overview will appear here.</p>
          <Link className={calendarStyles['an-action']} href={`/calendar?week=${toKey(week)}`}>Back to calendar</Link>
        </section>
      ) : (
        <>
          <AnalyticsCharts current={current} compared={compared} compareEnabled={compareEnabled} />
          <AnalyticsSections
            current={current}
            compared={compared}
            compareEnabled={compareEnabled}
          />
        </>
      )}
      <AnalyticsCategoryManager
        events={visibleEvents}
        categories={categories}
        categoryOf={currentCategory}
        onChange={updateCategory}
        onCreate={addCategory}
        message={categoryMessage}
      />
      <footer className={calendarStyles['an-footer']}>
        Analytics use planned calendar events. Categories are estimated from event titles and calendar colours; custom categories are saved in this browser, while event assignments apply for this visit only. Study time reflects scheduled plans, not completed sessions.
      </footer>
    </main>
  )
}
