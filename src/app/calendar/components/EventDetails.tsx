'use client'

import { useId, useState } from 'react'
import { AlignLeft, CalendarDays, Clock3, Pencil, Trash2, X } from 'lucide-react'
import s from '../calendar.module.css'
import { fmtTime, fromKey, longDate, type CalEvent } from '../lib'
import Dialog from './Dialog'

export default function EventDetails({
  event,
  onEdit,
  onDelete,
  onClose,
}: {
  event: CalEvent
  onEdit: () => void
  onDelete: () => void
  onClose: () => void
}) {
  const uid = useId()
  const [confirm, setConfirm] = useState(false)
  return (
    <Dialog onClose={onClose} labelledBy={`${uid}-h`}>
      <div className={`${s.details} ${s['ev_' + event.color]}`}>
        <div className={s.modalHead}>
          <span className={s.detailsDot} aria-hidden="true" />
          <h2 id={`${uid}-h`} className={s.modalTitle}>
            {event.title}
          </h2>
          <button type="button" className={s.iconBtn} aria-label="Close" onClick={onClose} data-autofocus>
            <X size={18} />
          </button>
        </div>
        <ul className={s.detailsList}>
          <li>
            <CalendarDays size={16} aria-hidden="true" />
            <span>{longDate(fromKey(event.date))}</span>
          </li>
          <li>
            <Clock3 size={16} aria-hidden="true" />
            <span>
              {fmtTime(event.start)} – {fmtTime(event.end)}
            </span>
          </li>
          <li>
            <AlignLeft size={16} aria-hidden="true" />
            <span className={event.description ? '' : s.muted}>{event.description || 'No description'}</span>
          </li>
        </ul>
        <div className={s.modalActions}>
          <button type="button" className={s.dangerBtn} onClick={() => (confirm ? onDelete() : setConfirm(true))}>
            <Trash2 size={15} aria-hidden="true" /> {confirm ? 'Confirm delete' : 'Delete'}
          </button>
          <span className={s.spacer} />
          <button type="button" className={s.primaryBtn} onClick={onEdit}>
            <Pencil size={14} aria-hidden="true" /> Edit
          </button>
        </div>
      </div>
    </Dialog>
  )
}
