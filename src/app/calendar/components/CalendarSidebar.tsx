'use client'

import Link from 'next/link'
import { Plus, X } from 'lucide-react'
import s from '../calendar.module.css'
import type { CalEvent } from '../lib'
import MiniCalendar from './MiniCalendar'

interface Props {
  open: boolean
  selected: Date
  today: Date
  events: CalEvent[]
  onClose: () => void
  onCreate: () => void
  onSelect: (d: Date) => void
}

export default function CalendarSidebar({ open, selected, today, events, onClose, onCreate, onSelect }: Props) {
  return (
    <>
      <div className={`${s.backdrop} ${open ? s.backdropOpen : ''}`} onClick={onClose} aria-hidden="true" />
      <aside id="calendar-sidebar" className={`${s.sidebar} ${open ? s.sidebarOpen : ''}`} aria-label="Calendar sidebar">
        <div className={s.sidebarTop}>
          <Link href="/" className={s.sidebarBrand} aria-label="Flowtives home" onClick={onClose}>
            Flowtives
          </Link>
          <button type="button" className={`${s.iconBtn} ${s.sidebarClose}`} aria-label="Close sidebar" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <button type="button" className={s.createBtn} onClick={onCreate}>
          <span className={s.createChip}>
            <Plus size={16} aria-hidden="true" />
          </span>
          Create
        </button>
        <MiniCalendar key={selected.getTime()} selected={selected} today={today} events={events} onSelect={onSelect} />
      </aside>
    </>
  )
}
