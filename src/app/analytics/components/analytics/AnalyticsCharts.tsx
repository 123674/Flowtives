'use client'

import { BookOpen, CalendarDays, Clock3, Coffee } from 'lucide-react'
import { toKey, weekdayShort } from '../../../calendar/lib'
import {
  categoryColor,
  compareWeeks,
  type WeekSummary,
} from '../../../../lib/analytics'
import styles from '../../../calendar/calendar.module.css'
import type { AnalyticsDataProps } from './types'

const CATEGORY_TINTS: Record<string, string> = {
  lavender: '#7b6df0',
  mint: '#3f9c80',
  blue: '#5b8fdc',
  peach: '#ec9a70',
}

function durationLabel(minutes: number) {
  const whole = Math.round(minutes)
  const hours = Math.floor(whole / 60)
  const mins = whole % 60
  if (!hours) return `${mins}m`
  if (!mins) return `${hours}h`
  return `${hours}h ${String(mins).padStart(2, '0')}m`
}

function SummaryCards({ current }: AnalyticsDataProps) {
  const plannedDays = current.days.filter((day) => day.totalMinutes > 0).length
  const studyDays = current.days.filter((day) => day.minutesByCategory.Study > 0).length
  const metrics = [
    { title: 'Total planned', value: durationLabel(current.totalMinutes), detail: 'Scheduled time this week', Icon: Clock3, tone: 'coral' },
    { title: 'Study time', value: durationLabel(current.minutesByCategory.Study), detail: 'Planned study sessions', Icon: BookOpen, tone: 'violet' },
    { title: 'Study days', value: `${studyDays} / 7`, detail: `${plannedDays} day${plannedDays === 1 ? '' : 's'} with plans`, Icon: CalendarDays, tone: 'green' },
    { title: 'Breaks & downtime', value: durationLabel(current.minutesByCategory['Meals and breaks']), detail: 'Meals, breaks and resets', Icon: Coffee, tone: 'blue' },
  ]

  return (
    <section className={styles['an-kpis']} aria-label="Weekly summary">
      {metrics.map(({ title, value, detail, Icon, tone }) => (
        <article className={styles['an-kpi']} key={title}>
          <div className={styles['an-kpiTop']}>
            <h2>{title}</h2>
            <span className={`${styles['an-kpiIcon']} ${styles[`an-kpiIcon-${tone}`]}`}><Icon size={17} aria-hidden="true" /></span>
          </div>
          <p className={styles['an-kpiValue']}>{value}</p>
          <p className={styles['an-kpiSub']}>{detail}</p>
        </article>
      ))}
    </section>
  )
}

function WeeklyPlanChart({ current, compared, compareEnabled }: AnalyticsDataProps) {
  const values = [...current.days, ...(compareEnabled ? compared.days : [])].map((day) => day.totalMinutes / 60)
  const ceiling = Math.max(2, Math.ceil(Math.max(0, ...values) / 2) * 2)
  const chartTop = 16
  const chartBottom = 190
  const chartHeight = chartBottom - chartTop
  const axis = Array.from({ length: 5 }, (_, index) => ceiling * index / 4)
  const groupX = (index: number) => 78 + index * 91

  return (
    <section className={`${styles['an-card']} ${styles['an-planCard']}`} aria-labelledby="an-plan-heading">
      <div className={styles['an-sectionHead']}>
        <div><h2 id="an-plan-heading">Your week at a glance</h2><p>Planned time by day</p></div>
        <span className={styles['an-weekTotal']}>{durationLabel(current.totalMinutes)} <small>planned</small></span>
      </div>
      {compareEnabled && (
        <div className={styles['an-chartLegend']} aria-label="Chart legend">
          <span><i />This week</span><span><i className={styles['an-compareLegend']} />Compared week</span>
        </div>
      )}
      <div className={styles['an-chartScroll']}>
        <svg className={styles['an-dailyChart']} viewBox="0 0 720 222" role="img" aria-label={`Planned hours per day for the week of ${toKey(current.start)}${compareEnabled ? `, compared with the week of ${toKey(compared.start)}` : ''}`}>
          {axis.map((value) => {
            const y = chartBottom - value / ceiling * chartHeight
            return <g key={value}><line x1="44" x2="710" y1={y} y2={y} className={styles['an-gridLine']} /><text x="34" y={y + 4} textAnchor="end" className={styles['an-axisLabel']}>{value}h</text></g>
          })}
          {current.days.map((day, index) => {
            const currentHours = day.totalMinutes / 60
            const currentHeight = currentHours / ceiling * chartHeight
            const compareDay = compared.days[index]
            const compareHours = compareDay.totalMinutes / 60
            const compareHeight = compareHours / ceiling * chartHeight
            const x = groupX(index)
            return (
              <g key={toKey(day.date)}>
                {compareEnabled && <rect x={x} y={chartBottom - compareHeight} width="26" height={Math.max(compareHeight, 1)} rx="7" className={styles['an-planCompareBar']} aria-label={`${weekdayShort(day.date)}, compared week: ${durationLabel(compareDay.totalMinutes)}`}><title>{`${weekdayShort(day.date)}, compared week: ${durationLabel(compareDay.totalMinutes)}`}</title></rect>}
                <rect x={x + (compareEnabled ? 31 : 9)} y={chartBottom - currentHeight} width="26" height={Math.max(currentHeight, 1)} rx="7" className={styles['an-planBar']} aria-label={`${weekdayShort(day.date)}: ${durationLabel(day.totalMinutes)} planned`}><title>{`${weekdayShort(day.date)}: ${durationLabel(day.totalMinutes)} planned`}</title></rect>
                <text x={x + (compareEnabled ? 29 : 22)} y="212" textAnchor="middle" className={styles['an-dayLabel']}>{weekdayShort(day.date)}</text>
              </g>
            )
          })}
        </svg>
      </div>
    </section>
  )
}

function SubjectBreakdown({ current }: { current: WeekSummary }) {
  const total = current.totalMinutes
  const radius = 70
  const circumference = 2 * Math.PI * radius
  const segments = current.categories.map((category, index) => {
    const minutes = current.minutesByCategory[category]
    const length = total > 0 ? circumference * minutes / total : 0
    const offset = current.categories.slice(0, index).reduce((sum, previous) => sum + circumference * current.minutesByCategory[previous] / (total || 1), 0)
    const segment = { category, minutes, length, offset, color: CATEGORY_TINTS[categoryColor(category)] }
    return segment
  })

  return (
    <section className={`${styles['an-card']} ${styles['an-subjectCard']}`} aria-labelledby="an-subject-heading">
      <div className={styles['an-sectionHead']}>
        <div><h2 id="an-subject-heading">Where your time goes</h2><p>Planned time by category</p></div>
      </div>
      <div className={styles['an-subjectContent']}>
        <div className={styles['an-donutWrap']}>
          <svg className={styles['an-donut']} viewBox="0 0 180 180" role="img" aria-label="Planned time breakdown by event category">
            <circle cx="90" cy="90" r={radius} className={styles['an-donutTrack']} />
            {segments.filter((segment) => segment.length > 0).map((segment) => (
              <circle
                key={segment.category}
                cx="90"
                cy="90"
                r={radius}
                className={styles['an-donutSegment']}
                stroke={segment.color}
                strokeDasharray={`${segment.length} ${circumference - segment.length}`}
                strokeDashoffset={-segment.offset}
              />
            ))}
          </svg>
          <div className={styles['an-donutCenter']}><strong>{durationLabel(total)}</strong><span>planned</span></div>
        </div>
        <ul className={styles['an-subjectLegend']}>
          {segments.map(({ category, minutes, color }) => (
            <li key={category}><span><i style={{ backgroundColor: color }} />{category}</span><strong>{durationLabel(minutes)}</strong></li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default function AnalyticsCharts(props: AnalyticsDataProps) {
  const difference = compareWeeks(props.current, props.compared)

  return (
    <>
      <SummaryCards {...props} />
      {props.compareEnabled && (
        <p className={styles['an-compareSummary']}>
          Compared with the selected week: {difference.totalMinutes === 0 ? 'your total planned time is unchanged.' : `${difference.totalMinutes > 0 ? 'up' : 'down'} ${durationLabel(Math.abs(difference.totalMinutes))} in planned time.`}
        </p>
      )}
      <div className={styles['an-chartGrid']}>
        <WeeklyPlanChart {...props} />
        <SubjectBreakdown current={props.current} />
      </div>
    </>
  )
}
