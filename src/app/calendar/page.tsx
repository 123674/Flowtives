import type { Metadata } from 'next'
import CalendarPage from './CalendarPage'

export const metadata: Metadata = {
  title: 'Calendar — Flowtives',
  description: 'Your week at a glance, with room to plan.',
}

export default function Page() {
  return <CalendarPage />
}
