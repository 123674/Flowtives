'use client'

import { useState, useSyncExternalStore } from 'react'
import s from './calendar.module.css'
import CalendarSidebar from './components/CalendarSidebar'
import CalendarToolbar from './components/CalendarToolbar'
import EventDetails from './components/EventDetails'
import EventModal from './components/EventModal'
import FlowtivesAIChat from './components/FlowtivesAIChat'
import WeekGrid from './components/WeekGrid'
import { addDays, fromKey, fromMin, startOfDay, startOfWeek, toKey, toMin, type CalEvent, type Draft } from './lib'
import { clock, eventStore } from './store'

type Modal = { kind: 'form'; draft: Draft } | { kind: 'view'; id: string } | null

export default function CalendarPage() {
  const nowTs = useSyncExternalStore(clock.subscribe, clock.getSnapshot, clock.getServerSnapshot)
  const events = useSyncExternalStore(eventStore.subscribe, eventStore.getSnapshot, eventStore.getServerSnapshot)
  const [selected, setSelected] = useState<Date | null>(null)
  const [modal, setModal] = useState<Modal>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [focusReq, setFocusReq] = useState<{ minutes: number; n: number } | null>(null)
  const [highlightId, setHighlightId] = useState<string | null>(null)

  // First paint matches the server (no clock yet); the real calendar appears on hydration.
  if (!nowTs) return <div className={`${s.root} flowtives-calendar`} aria-busy="true" />

  const today = startOfDay(new Date(nowTs))
  const current = selected ?? today
  const weekStart = startOfWeek(current)

  const blankDraft = (date: string, start: string, end: string): Draft => ({ title: '', date, start, end, description: '', color: 'lavender' })

  const defaultDraft = (): Draft => {
    const isToday = toKey(current) === toKey(today)
    const now = new Date(nowTs)
    const st = isToday ? Math.min((now.getHours() + 1) * 60, 22 * 60) : 9 * 60
    return blankDraft(toKey(current), fromMin(st), fromMin(st + 60))
  }

  const upsert = (ev: CalEvent) => {
    const exists = events.some((e) => e.id === ev.id)
    eventStore.set(exists ? events.map((e) => (e.id === ev.id ? ev : e)) : [...events, ev])
  }

  const save = (ev: CalEvent) => {
    upsert(ev)
    setSelected(fromKey(ev.date))
    setFocusReq((p) => ({ minutes: toMin(ev.start), n: (p?.n ?? 0) + 1 }))
    setModal(null)
  }

  const remove = (id: string) => {
    eventStore.set(events.filter((e) => e.id !== id))
    setModal(null)
  }

  const pick = (ev: CalEvent) => {
    setSelected(fromKey(ev.date))
    setFocusReq((p) => ({ minutes: toMin(ev.start), n: (p?.n ?? 0) + 1 }))
    setHighlightId(ev.id)
    window.setTimeout(() => setHighlightId(null), 2600)
  }

  const viewing = modal?.kind === 'view' ? events.find((e) => e.id === modal.id) : undefined

  return (
    <div className={`${s.root} flowtives-calendar`}>
      <CalendarToolbar
        weekStart={weekStart}
        events={events}
        onMenu={() => setSidebarOpen(true)}
        onToday={() => setSelected(today)}
        onShift={(w) => setSelected(addDays(current, w * 7))}
        onPick={pick}
      />
      <div className={s.body}>
        <CalendarSidebar
          open={sidebarOpen}
          selected={current}
          today={today}
          events={events}
          onClose={() => setSidebarOpen(false)}
          onCreate={() => {
            setSidebarOpen(false)
            setModal({ kind: 'form', draft: defaultDraft() })
          }}
          onSelect={(d) => {
            setSelected(d)
            setSidebarOpen(false)
          }}
        />
        <main className={s.main}>
          <div className={s.gridCard}>
            <WeekGrid
              weekStart={weekStart}
              today={today}
              nowTs={nowTs}
              events={events}
              highlightId={highlightId}
              focusReq={focusReq}
              onCreate={(date, start, end) => setModal({ kind: 'form', draft: blankDraft(date, start, end) })}
              onOpen={(id) => setModal({ kind: 'view', id })}
              onMove={(id, date, start, end) => {
                const ev = events.find((e) => e.id === id)
                if (ev) upsert({ ...ev, date, start, end })
              }}
            />
          </div>
        </main>
      </div>

      <FlowtivesAIChat
        open={chatOpen}
        onOpen={() => setChatOpen(true)}
        onClose={() => setChatOpen(false)}
        events={events}
        weekStart={weekStart}
        nowTs={nowTs}
        onSuggest={(d) => setModal({ kind: 'form', draft: { ...blankDraft(d.date, d.start, d.end), title: d.title, color: 'mint' } })}
      />

      {modal?.kind === 'form' && (
        <EventModal
          key={modal.draft.id ?? 'new'}
          initial={modal.draft}
          onSave={save}
          onDelete={modal.draft.id ? () => remove(modal.draft.id!) : undefined}
          onClose={() => setModal(null)}
        />
      )}
      {viewing && (
        <EventDetails
          event={viewing}
          onClose={() => setModal(null)}
          onEdit={() => setModal({ kind: 'form', draft: viewing })}
          onDelete={() => remove(viewing.id)}
        />
      )}
    </div>
  )
}
