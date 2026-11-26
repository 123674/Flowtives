'use client'

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { ArrowUp, FileUp, Sparkles, X } from 'lucide-react'
import s from '../calendar.module.css'
import type { CalEvent } from '../lib'

interface Msg {
  id: number
  role: 'ai' | 'user'
  text: string
  fileName?: string
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
  const [file, setFile] = useState<File | null>(null)
  const logRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
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
    if ((!value && !file) || thinking) return
    // Both the typed text and the attached file (if any) go out together in one message.
    setMsgs((m) => [...m, { id: nextId.current++, role: 'user', text: value, fileName: file?.name }])
    setText('')
    setFile(null)
    setThinking(true)
    window.setTimeout(() => {
      setMsgs((m) => [...m, { id: nextId.current++, role: 'ai', ...demoReply() }])
      setThinking(false)
    }, 650)
  }

  /** Timetable upload: opens the device file picker and stages the file; it is sent together with the text on Send. */
  const onFilePicked = (e: ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0]
    e.target.value = ''
    if (!picked) return
    setFile(picked)
    inputRef.current?.focus()
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
              {m.fileName && <div className={s.msgFile}>📎 {m.fileName}</div>}
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
          <input
            ref={fileRef}
            type="file"
            hidden
            accept="image/*,.pdf,.csv,.xls,.xlsx,.doc,.docx,.txt,.ics"
            aria-label="Upload timetable"
            onChange={onFilePicked}
          />
          {file && (
            <div className={s.aiFile}>
              <span className={s.aiFileName} title={file.name}>📎 {file.name}</span>
              <button type="button" className={s.aiFileRemove} aria-label="Remove attached file" onClick={() => setFile(null)}>
                <X size={14} />
              </button>
            </div>
          )}
          <button type="button" className={s.uploadBtn} aria-label="Upload timetable" title="Upload timetable" disabled={thinking} onClick={() => fileRef.current?.click()}>
            <FileUp size={18} />
          </button>
          <input ref={inputRef} type="text" aria-label="Message Flowtives" placeholder="Ask Flowtives to plan…" value={text} onChange={(e) => setText(e.target.value)} />
          <button type="submit" className={s.sendBtn} aria-label="Send message" disabled={(!text.trim() && !file) || thinking}>
            <ArrowUp size={17} />
          </button>
        </form>
      </aside>
    </>
  )
}