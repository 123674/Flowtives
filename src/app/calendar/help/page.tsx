'use client'

import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, MessageCircle, Minus, Plus, X } from 'lucide-react'
import s from './help.module.css'

/** Placeholder: replace with your real support address. */
const SUPPORT_EMAIL = 'support@flowtives.com'
const MAX_CHARS = 2000

/* ---------- FAQs ---------- */
const FAQS: { q: string; a: string }[] = [
  { q: 'How do I add, edit or delete an event?', a: 'Click or tap an empty slot in the week grid, or use the Create button in the sidebar. Open an existing event to edit or delete it.' },
  { q: 'Where are my events stored?', a: 'For now, events are saved in your browser on this device. Clearing your browser data removes them, and they will not appear on another device yet.' },
  { q: 'What can the AI planner do?', a: 'It is designed to turn your timetable and priorities into a plan, suggest study or break slots, and answer questions about your week.' },
  { q: 'Why does the AI say the API is not connected yet?', a: 'The AI backend is still being connected. Until then the planner replies with a placeholder message and cannot read your uploaded files.' },
  { q: 'Which timetable files can I upload?', a: 'Images, PDF, CSV, Excel, Word, text and .ics files. Reading them starts working once the AI backend is connected.' },
  { q: 'How do I sign out?', a: 'Open the account icon at the top right of the calendar and choose Sign out. You will return to the home page.' },
  { q: 'How do I open the mini calendar on my phone?', a: 'Tap the menu icon at the top left of the calendar to open the sidebar with the mini calendar.' },
  { q: 'Where is the AI chat on mobile?', a: 'Tap the AI button at the bottom right of the screen. The chat slides up from the bottom.' },
]

/* ---------- feedback form ---------- */
type Kind = 'An idea' | 'An issue' | 'Other'
const KINDS: Kind[] = ['An idea', 'An issue', 'Other']

interface Payload {
  kind: Kind
  message: string
  email: string
  canContact: boolean
  file: File | null
}

/** Not connected yet: replace the body with a real request, e.g. POST a FormData to `${process.env.NEXT_PUBLIC_FASTAPI_URL}/feedback`. */
async function sendFeedback(data: Payload): Promise<void> {
  void data
  await new Promise((resolve) => window.setTimeout(resolve, 700))
}

function FeedbackCard() {
  const [kind, setKind] = useState<Kind>('An idea')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [canContact, setCanContact] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const fileRef = useRef<HTMLInputElement>(null)

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0]
    e.target.value = ''
    if (picked) setFile(picked)
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!message.trim() || status === 'sending') return
    setStatus('sending')
    try {
      await sendFeedback({ kind, message: message.trim(), email: email.trim(), canContact, file })
      setStatus('sent')
      setKind('An idea')
      setMessage('')
      setEmail('')
      setCanContact(false)
      setFile(null)
    } catch {
      setStatus('error')
    }
  }

  return (
    <section className={s.feedback} aria-labelledby="feedback-title">
      <h2 id="feedback-title" className={s.cardTitle}>Send feedback</h2>
      <p className={s.cardIntro}>Have an idea or spotted something? We’d love to hear from you.</p>

      {status === 'sent' ? (
        <div className={s.success} role="status">
          <span className={s.successIcon} aria-hidden="true">
            <Check size={18} />
          </span>
          <div>
            <strong>Thanks for your feedback</strong>
            <p>We have received your message.</p>
          </div>
          <button type="button" className={s.textBtn} onClick={() => setStatus('idle')}>
            Send another
          </button>
        </div>
      ) : (
        <form className={s.form} onSubmit={submit}>
          <fieldset className={s.kinds}>
            <legend className={s.label}>What would you like to share?</legend>
            <div className={s.kindRow}>
              {KINDS.map((k) => (
                <label key={k} className={`${s.kind} ${kind === k ? s.kindOn : ''}`}>
                  <input type="radio" name="feedback-kind" value={k} checked={kind === k} onChange={() => setKind(k)} />
                  {k}
                </label>
              ))}
            </div>
          </fieldset>

          <div className={s.field}>
            <label className={s.label} htmlFor="feedback-message">Your feedback</label>
            <textarea
              id="feedback-message"
              required
              maxLength={MAX_CHARS}
              placeholder="Tell us what’s on your mind…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <span className={s.counter}>
              {message.length.toLocaleString('en-US')} / {MAX_CHARS.toLocaleString('en-US')}
            </span>
          </div>

          <div>
            <input ref={fileRef} type="file" hidden accept="image/*" aria-label="Attach a screenshot" onChange={onFile} />
            {file ? (
              <div className={s.fileChip}>
                <span className={s.fileName} title={file.name}>
                  📎 {file.name}
                </span>
                <button type="button" className={s.chipX} aria-label="Remove screenshot" onClick={() => setFile(null)}>
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button type="button" className={s.attachBtn} onClick={() => fileRef.current?.click()}>
                <Plus size={16} aria-hidden="true" />
                Attach a screenshot
              </button>
            )}
          </div>

          <div className={s.field}>
            <label className={s.label} htmlFor="feedback-email">Email address (optional)</label>
            <input id="feedback-email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <span className={s.help}>So we can follow up on your feedback.</span>
          </div>

          <label className={s.check}>
            <input type="checkbox" checked={canContact} onChange={(e) => setCanContact(e.target.checked)} />
            You can contact me about this feedback.
          </label>

          {status === 'error' && (
            <p className={s.error} role="alert">
              Something went wrong. Please try again or email {SUPPORT_EMAIL}.
            </p>
          )}

          <button type="submit" className={s.submit} disabled={!message.trim() || status === 'sending'}>
            {status === 'sending' ? 'Sending…' : 'Send feedback'}
          </button>
          <p className={s.note}>Please don’t include passwords or sensitive information in your feedback.</p>
        </form>
      )}
    </section>
  )
}

/* ---------- page ---------- */
export default function HelpPage() {
  return (
    <div className={s.page}>
      <div className={s.wrap}>
        <Link href="/calendar" className={s.back}>
          <ArrowLeft size={16} aria-hidden="true" />
          Back to calendar
        </Link>
        <h1 className={s.title}>Help &amp; feedback</h1>
        <p className={s.subtitle}>Find quick answers, share your feedback, or get in touch with our team.</p>

        <div className={s.grid}>
          <div className={s.left}>
            <h2 className={s.sectionTitle}>Frequently asked questions</h2>
            <div className={s.faqList}>
              {FAQS.map((f, i) => (
                <details key={f.q} className={s.faq} open={i === 0}>
                  <summary>
                    <span>{f.q}</span>
                    <Plus size={18} className={s.plus} aria-hidden="true" />
                    <Minus size={18} className={s.minus} aria-hidden="true" />
                  </summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>

            <section className={s.contact} aria-labelledby="contact-title">
              <MessageCircle size={28} className={s.contactIcon} aria-hidden="true" />
              <div className={s.contactText}>
                <h2 id="contact-title">Contact &amp; support</h2>
                <p>Can’t find what you need? Get in touch with our support team.</p>
              </div>
              <a href={`mailto:${SUPPORT_EMAIL}`} className={s.contactBtn}>
                Contact support
              </a>
            </section>
          </div>

          <FeedbackCard />
        </div>
      </div>
    </div>
  )
}