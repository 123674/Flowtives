'use client'

import { useId, useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import s from '../calendar.module.css'
import { COLORS, toMin, type CalEvent, type Draft } from '../lib'
import Dialog from './Dialog'

type Errors = Partial<Record<'title' | 'date' | 'start' | 'end', string>>

interface Props {
  initial: Draft
  onSave: (event: CalEvent) => void
  onDelete?: () => void
  onClose: () => void
}

export default function EventModal({ initial, onSave, onDelete, onClose }: Props) {
  const uid = useId()
  const editing = Boolean(initial.id)
  const [title, setTitle] = useState(initial.title)
  const [date, setDate] = useState(initial.date)
  const [start, setStart] = useState(initial.start)
  const [end, setEnd] = useState(initial.end)
  const [description, setDescription] = useState(initial.description)
  const [color, setColor] = useState(initial.color)
  const [errors, setErrors] = useState<Errors>({})
  const [confirmDelete, setConfirmDelete] = useState(false)

  const dialogColors: Record<string, string> = {
  lavender: '#E4DEFF',
  mint: '#E6F8EE',
  blue: '#E8F2FF',
  peach: '#FFF0E6',
  }

  const selectedColor = dialogColors[color] ?? '#FFFFFF'

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const next: Errors = {}
    if (!title.trim()) next.title = 'Add a title for your event.'
    if (!date) next.date = 'Choose a date.'
    if (!start) next.start = 'Choose a start time.'
    if (!end) next.end = 'Choose an end time.'
    else if (start && toMin(end) <= toMin(start)) next.end = 'End time must be after the start time.'
    setErrors(next)
    if (Object.keys(next).length) return
    onSave({
      id: initial.id ?? (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Math.random()).slice(2)),
      title: title.trim(),
      date,
      start,
      end,
      description: description.trim(),
      color,
    })
  }

  const err = (k: keyof Errors) => (errors[k] ? { 'aria-invalid': true, 'aria-describedby': `${uid}-${k}-err` } : {})
  const msg = (k: keyof Errors) =>
    errors[k] ? (
      <p className={s.error} id={`${uid}-${k}-err`} role="alert">
        {errors[k]}
      </p>
    ) : null

  return (
    <Dialog onClose={onClose} labelledBy={`${uid}-h`}>
      <div className={s.dialogColorBg}
    style={{ '--selected-color': selectedColor } as React.CSSProperties}>
      <form className={s.modalForm} onSubmit={submit} noValidate>
        <div className={s.modalHead}>
          <h2 id={`${uid}-h`} className={s.modalTitle}>
            {editing ? 'Edit event' : 'New event'}
          </h2>
          <button type="button" className={s.iconBtn} aria-label="Close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className={s.field}>
          <label htmlFor={`${uid}-title`}>Title</label>
          <input id={`${uid}-title`} data-autofocus type="text" value={title} placeholder="Study session" onChange={(e) => setTitle(e.target.value)} {...err('title')} />
          {msg('title')}
        </div>

        <div className={s.field}>
          <label htmlFor={`${uid}-date`}>Date</label>
          <input id={`${uid}-date`} type="date" value={date} onChange={(e) => setDate(e.target.value)} {...err('date')} />
          {msg('date')}
        </div>

        <div className={s.fieldRow}>
          <div className={s.field}>
            <label htmlFor={`${uid}-start`}>Start time</label>
            <input id={`${uid}-start`} type="time" value={start} onChange={(e) => setStart(e.target.value)} {...err('start')} />
            {msg('start')}
          </div>
          <div className={s.field}>
            <label htmlFor={`${uid}-end`}>End time</label>
            <input id={`${uid}-end`} type="time" value={end} onChange={(e) => setEnd(e.target.value)} {...err('end')} />
            {msg('end')}
          </div>
        </div>

        <div className={s.field}>
          <label htmlFor={`${uid}-desc`}>
            Description <span className={s.optional}>(optional)</span>
          </label>
          <textarea id={`${uid}-desc`} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <fieldset className={s.colors}>
          <legend>Colour</legend>
          {COLORS.map((c) => (
            <label key={c.id} className={`${s.swatch} ${s['ev_' + c.id]}`}>
              <input type="radio" name={`${uid}-color`} value={c.id} checked={color === c.id} onChange={() => setColor(c.id)} />
              <span className={s.swatchDot} />
              <span className={s.srOnly}>{c.label}</span>
            </label>
          ))}
        </fieldset>

        <div className={s.modalActions}>
          {editing && onDelete && (
            <button
              type="button"
              className={s.dangerBtn}
              onClick={() => (confirmDelete ? onDelete() : setConfirmDelete(true))}
            >
              {confirmDelete ? 'Confirm delete' : 'Delete'}
            </button>
          )}
          <span className={s.spacer} />
          <button type="button" className={s.ghostBtn} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={s.primaryBtn}>
            Save
          </button>
        </div>
      </form>
      </div>
    </Dialog>
  )
}
