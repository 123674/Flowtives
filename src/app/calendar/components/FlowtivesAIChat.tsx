'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowUp, Sparkles, X } from 'lucide-react'
import s from '../calendar.module.css'
import { addDays, findFreeSlot, fmtRange, fromKey, shortDate, toKey, type CalEvent } from '../lib'

interface Msg {
  id: number
  role: 'ai' | 'user'
  text: string
  action?: { label: string; title: string; date: string; start: string; end: string }
}

const SUGGESTIONS = ['Plan my week', 'Find time to study', 'Organize my tasks', 'Make room for breaks']

interface Props {
  open: boolean
  onOpen: () => void
  onClose: () => void
  events: CalEvent[]
  weekStart: Date
  nowTs: number
  onSuggest: (d: { title: string; date: string; start: string; end: string }) => void
}

export default function FlowtivesAIChat({ open, onOpen, onClose, events, weekStart, nowTs, onSuggest }: Props) {
  const [msgs, setMsgs] = useState<Msg[]>([
    { id: 0, role: 'ai', text: 'Let’s make your week work for you. What would you like to plan?' },
  ])
  const [text, setText] = useState('')
  const [thinking, setThinking] = useState(false)
  const logRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const nextId = useRef(1)

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [msgs, thinking])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  /** Local demo behaviour only: simple keyword rules over the events already on screen. */
  const demoReply = (input: string): Omit<Msg, 'id' | 'role'> => {
    const t = input.toLowerCase()
    const slotReply = (minutes: number, title: string, lead: string) => {
      const slot = findFreeSlot(events, weekStart, minutes, nowTs)
      if (!slot) return { text: 'I couldn’t find an open window between 9 AM and 8 PM this week.' }
      return {
        text: `${lead} ${shortDate(fromKey(slot.date))}, ${fmtRange(slot.start, slot.end)}.`,
        action: { label: `Add “${title}”`, title, ...slot },
      }
    }
    if (/study|focus|time/.test(t)) return slotReply(90, 'Study block', 'The first open 90-minute window this week is')
    if (/break|room|rest/.test(t)) return slotReply(30, 'Break', 'There’s space for a 30-minute break on')
    if (/week|plan/.test(t)) {
      const keys = Array.from({ length: 7 }, (_, i) => toKey(addDays(weekStart, i)))
      const inWeek = events.filter((e) => keys.includes(e.date))
      if (!inWeek.length) return { text: 'This week is wide open. Add a few events and I can point out where to fit study time.' }
      const counts = keys.map((k) => inWeek.filter((e) => e.date === k).length)
      const busiest = keys[counts.indexOf(Math.max(...counts))]
      return { text: `You have ${inWeek.length} event${inWeek.length === 1 ? '' : 's'} this week, busiest on ${shortDate(fromKey(busiest))}. Ask me to find study time or a break and I’ll look for a gap.` }
    }
    if (/task|organi[sz]e|todo/.test(t)) return { text: 'Task lists are coming soon. For now, create an event for each task and I can find gaps around them.' }
    return { text: 'This preview can look for study time, breaks, and give a quick overview of your week. Try one of the suggestions.' }
  }

  const send = (raw: string) => {
    const value = raw.trim()
    if (!value || thinking) return
    setMsgs((m) => [...m, { id: nextId.current++, role: 'user', text: value }])
    setText('')
    setThinking(true)
    window.setTimeout(() => {
      setMsgs((m) => [...m, { id: nextId.current++, role: 'ai', ...demoReply(value) }])
      setThinking(false)
    }, 650)
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    send(text)
  }

  return (
    <>
      {!open && (
        <button type="button" className={s.aiTab} onClick={onOpen} aria-expanded="false" aria-controls="flowtives-ai">
          <span className={s.aiTabIcon}>
            <Sparkles size={15} aria-hidden="true" />
          </span>
          <span className={s.aiTabText}>Plan with Flowtives</span>
        </button>
      )}
      <aside id="flowtives-ai" className={`${s.aiPanel} ${open ? s.aiPanelOpen : ''}`} aria-label="Plan with Flowtives" aria-hidden={!open}>
        <div className={s.aiHead}>
          <span className={s.aiTabIcon}>
            <Sparkles size={16} aria-hidden="true" />
          </span>
          <div className={s.aiHeadText}>
            <h2>Plan with Flowtives</h2>
            <small>Demo preview · replies are local examples</small>
          </div>
          <button type="button" className={s.iconBtn} aria-label="Close planner" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className={s.aiLog} ref={logRef} role="log" aria-live="polite">
          {msgs.map((m) => (
            <div key={m.id} className={m.role === 'ai' ? s.aiBubble : s.userBubble}>
              {m.text}
              {m.action && (
                <button
                  type="button"
                  className={s.aiAction}
                  onClick={() => onSuggest({ title: m.action!.title, date: m.action!.date, start: m.action!.start, end: m.action!.end })}
                >
                  {m.action.label}
                </button>
              )}
            </div>
          ))}
          {thinking && <div className={`${s.aiBubble} ${s.aiThinking}`} aria-label="Flowtives is typing"><i /><i /><i /></div>}
          {msgs.length === 1 && (
            <div className={s.chips}>
              {SUGGESTIONS.map((x) => (
                <button key={x} type="button" className={s.chip} onClick={() => send(x)}>
                  {x}
                </button>
              ))}
            </div>
          )}
        </div>

        <form className={s.aiForm} onSubmit={submit}>
          <input ref={inputRef} type="text" aria-label="Message Flowtives" placeholder="Ask Flowtives to plan…" value={text} onChange={(e) => setText(e.target.value)} />
          <button type="submit" className={s.sendBtn} aria-label="Send message" disabled={!text.trim() || thinking}>
            <ArrowUp size={17} />
          </button>
        </form>
      </aside>
    </>
  )
}
