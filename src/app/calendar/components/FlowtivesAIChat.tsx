'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowUp, FileUp, Sparkles, X } from 'lucide-react'
import { z } from 'zod'
import s from '../calendar.module.css'
import { toKey, type Draft } from '../lib'
import type { TimetableSlot } from '@/lib/timetable'
import FormattedText from './FormattedText'

interface Msg {
  id: number
  role: 'ai' | 'user'
  text: string
  action?: { label: string; draft: Draft }
  undoId?: string
}

const SUGGESTIONS = ['Plan my week', 'Find time to study', 'Organize my tasks', 'Make room for breaks']
const responseSchema = z.object({
  text: z.string().optional(),
  proposedEvents: z.array(
      z.object({
        title: z.string(),
        date: z.string(),
        start: z.string(),
        end: z.string(),
        description: z.string(),
        color: z.enum(['lavender', 'mint', 'blue', 'peach']),
      }),
    ).optional(),
  error: z.string().optional(),
})
async function readJson(response: Response): Promise<unknown> {
  const raw = await response.text()
  if (!raw.trim()) throw new Error('The server closed the connection before replying. Please try again.')
  try {
    return JSON.parse(raw)
  } catch {
    throw new Error('The server returned an unexpected response. Please try again.')
  }
}

const uploadSchema = z.object({
  slots: z.array(z.object({
    weekday: z.number().int().min(0).max(6),
    title: z.string(),
    start: z.string(),
    end: z.string(),
    description: z.string(),
    color: z.enum(['lavender', 'mint', 'blue', 'peach']),
  })).optional(),
  error: z.string().optional(),
})

interface Props {
  open: boolean
  onOpen: () => void
  onClose: () => void
  events: Draft[]
  onSuggest: (draft: Draft) => void
  onImport: (slots: TimetableSlot[]) => string
  onUndoImport: (groupId: string) => void
}

export default function FlowtivesAIChat({ open, onOpen, onClose, events, onSuggest, onImport, onUndoImport }: Props) {
  const [msgs, setMsgs] = useState<Msg[]>([
    { id: 0, role: 'ai', text: 'Ask me about your calendar, upload a timetable, or tell me what event you would like to add.' },
  ])
  const [text, setText] = useState('')
  const [thinking, setThinking] = useState(false)
  const [uploading, setUploading] = useState(false)
  const logRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const nextId = useRef(1)

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [msgs, thinking, uploading])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const send = async (raw: string) => {
    const value = raw.trim()
    if (!value || thinking || uploading) return
    const history = msgs.slice(-12).map((message) => ({
      role: message.role === 'ai' ? 'model' : 'user',
      text: message.text,
    }))
    setMsgs((m) => [...m, { id: nextId.current++, role: 'user', text: value }])
    setText('')
    setThinking(true)
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: value,
          history,
          events,
          today: toKey(new Date()),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      })
      const payload = await readJson(response)
      const result = responseSchema.safeParse(payload)
      if (!result.success) throw new Error('The AI service returned an invalid response.')
      if (result.data.error) throw new Error(result.data.error)
      if (!response.ok) throw new Error('The AI request failed.')
      const { text: reply, proposedEvents } = result.data
      if (typeof reply !== 'string' || !proposedEvents) {
        throw new Error('The AI service returned an incomplete response.')
      }

      const actions = proposedEvents.map((draft) => ({
        label: `Review and add “${draft.title}”`,
        draft,
      }))
      setMsgs((m) => [
        ...m,
        {
          id: nextId.current++,
          role: 'ai',
          text: reply,
          ...(actions.length === 1 ? { action: actions[0] } : {}),
        },
        ...actions.slice(1).map((action) => ({
          id: nextId.current++,
          role: 'ai' as const,
          text: 'Here is another event draft:',
          action,
        })),
      ])
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The AI request failed. Please try again.'
      setMsgs((m) => [...m, { id: nextId.current++, role: 'ai', text: message }])
    } finally {
      setThinking(false)
    }
  }

  const upload = async (file: File) => {
    if (thinking || uploading) return
    setUploading(true)
    setMsgs((m) => [...m, { id: nextId.current++, role: 'user', text: `Uploaded ${file.name}` }])
    try {
      const form = new FormData()
      form.append('file', file)
      const response = await fetch('/api/ai/timetable', { method: 'POST', body: form })
      const payload = await readJson(response)
      const result = uploadSchema.safeParse(payload)
      if (!result.success) throw new Error('The timetable response was invalid.')
      if (result.data.error) throw new Error(result.data.error)
      if (!response.ok) throw new Error('The timetable could not be read.')

      const slots = result.data.slots ?? []
      if (!slots.length) {
        setMsgs((m) => [...m, { id: nextId.current++, role: 'ai', text: "I couldn't find any classes in that timetable. Try a clearer PDF or image." }])
        return
      }

      const groupId = onImport(slots)
      const count = slots.length
      setMsgs((m) => [...m, {
        id: nextId.current++,
        role: 'ai',
        text: `**Timetable added.** I found ${count} weekly class${count === 1 ? '' : 'es'} and repeated ${count === 1 ? 'it' : 'them'} on the matching weekdays for the next 8 weeks.`,
        undoId: groupId,
      }])
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The timetable could not be read.'
      setMsgs((m) => [...m, { id: nextId.current++, role: 'ai', text: message }])
    } finally {
      setUploading(false)
    }
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
            <small>Upload a timetable or ask about your events</small>
          </div>
          <button type="button" className={s.iconBtn} aria-label="Close planner" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className={s.aiLog} ref={logRef} role="log" aria-live="polite">
          {msgs.map((m) => (
            <div key={m.id} className={m.role === 'ai' ? s.aiBubble : s.userBubble}>
              {m.role === 'ai' ? <FormattedText text={m.text} /> : m.text}
              {m.action && (
                <button
                  type="button"
                  className={s.aiAction}
                  onClick={() => onSuggest(m.action!.draft)}
                >
                  {m.action.label}
                </button>
              )}
              {m.undoId && (
                <button
                  type="button"
                  className={s.aiUndo}
                  onClick={() => {
                    onUndoImport(m.undoId!)
                    setMsgs((prev) => prev.map((item) => item.id === m.id ? { ...item, undoId: undefined } : item))
                  }}
                >
                  Undo import
                </button>
              )}
            </div>
          ))}
          {thinking && <div className={`${s.aiBubble} ${s.aiThinking}`} aria-label="Flowtives is typing"><i /><i /><i /></div>}
          {uploading && <div className={`${s.aiBubble} ${s.aiUploading}`}>Reading your timetable…</div>}
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
          <label className={s.aiUpload} title="Upload a timetable (PDF or image)">
            <FileUp size={18} aria-hidden="true" />
            <span className={s.srOnly}>Upload a timetable PDF or image</span>
            <input
              type="file"
              aria-label="Upload a timetable PDF or image"
              accept="application/pdf,image/png,image/jpeg,image/webp,image/gif"
              disabled={uploading || thinking}
              onChange={(e) => {
                const file = e.currentTarget.files?.[0]
                e.currentTarget.value = ''
                if (file) void upload(file)
              }}
            />
          </label>
          <input ref={inputRef} type="text" aria-label="Message Flowtives" placeholder="Ask Flowtives to plan…" value={text} onChange={(e) => setText(e.target.value)} />
          <button type="submit" className={s.sendBtn} aria-label="Send message" disabled={!text.trim() || thinking || uploading}>
            <ArrowUp size={17} />
          </button>
        </form>
      </aside>
    </>
  )
}
