'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowUp, Sparkles, X } from 'lucide-react'
import s from '../calendar.module.css'
import type { CalEvent } from '../lib'

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

export default function FlowtivesAIChat({ open, onOpen, onClose, onSuggest }: Props) {
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

  /** Placeholder reply until the AI API is connected. */
  const demoReply = (): Omit<Msg, 'id' | 'role'> => ({
    text: 'The AI planner isn’t connected yet. Once the API is attached, I’ll be able to help plan your week.',
  })

  const send = (raw: string) => {
    const value = raw.trim()
    if (!value || thinking) return
    setMsgs((m) => [...m, { id: nextId.current++, role: 'user', text: value }])
    setText('')
    setThinking(true)
    window.setTimeout(() => {
      setMsgs((m) => [...m, { id: nextId.current++, role: 'ai', ...demoReply() }])
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
        <button type="button" className={s.aiTab} onClick={onOpen} aria-label="Plan with Flowtives" aria-expanded="false" aria-controls="flowtives-ai">
          <Sparkles size={22} aria-hidden="true" />
          <span className={s.aiTip} aria-hidden="true">
            Plan with Flowtives
          </span>
        </button>
      )}
      <aside id="flowtives-ai" className={`${s.aiPanel} ${open ? s.aiPanelOpen : ''}`} aria-label="Plan with Flowtives" aria-hidden={!open}>
        <div className={s.aiHead}>
          <span className={s.aiTabIcon}>
            <Sparkles size={16} aria-hidden="true" />
          </span>
          <div className={s.aiHeadText}>
            <h2>Plan with Flowtives</h2>
            <small>Waiting for AI API connection</small>
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
