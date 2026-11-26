import assert from 'node:assert/strict'
import test from 'node:test'
import { CATEGORIES, categoryColor, compareWeeks, formatPercentChange, getWeekRange, summariseWeek } from './analytics.ts'

const event = (id, date, start, end) => ({
  id,
  title: 'Study session',
  date,
  start,
  end,
  description: '',
  color: 'lavender',
})

test('splits an event that crosses midnight between local days', () => {
  const summary = summariseWeek([event('night', '2026-01-04', '23:00', '01:00')], new Date(2026, 0, 4))
  assert.equal(summary.days[0].totalMinutes, 60)
  assert.equal(summary.days[1].totalMinutes, 60)
  assert.equal(summary.totalMinutes, 120)
})

test('clips overlaps without double-counting scheduled time', () => {
  const summary = summariseWeek([
    event('first', '2026-01-04', '09:00', '11:00'),
    event('second', '2026-01-04', '10:00', '12:00'),
  ], new Date(2026, 0, 4))
  assert.equal(summary.days[0].totalMinutes, 180)
  assert.equal(summary.days[0].overlaps, 1)
  assert.ok(summary.days[0].totalMinutes <= 24 * 60)
})

test('counts all-day events separately from timed hours', () => {
  const summary = summariseWeek([event('all-day', '2026-01-04', '', '')], new Date(2026, 0, 4))
  assert.equal(summary.allDayCount, 1)
  assert.equal(summary.totalMinutes, 0)
})

test('summarises an empty week as zero time', () => {
  const summary = summariseWeek([], new Date(2026, 0, 4))
  assert.equal(summary.totalMinutes, 0)
  assert.equal(summary.allDayCount, 0)
})

test('reports new time rather than dividing by a zero baseline', () => {
  const current = summariseWeek([event('study', '2026-01-04', '09:00', '10:00')], new Date(2026, 0, 4))
  const previous = summariseWeek([], new Date(2025, 11, 28))
  assert.equal(formatPercentChange(compareWeeks(current, previous).studyMinutes, previous.minutesByCategory.Study), 'new')
  assert.equal(formatPercentChange(0, 0), '0%')
})

test('includes user-created categories in weekly totals and comparisons', () => {
  const categories = [...CATEGORIES, 'Volunteering']
  const customEvent = event('volunteer', '2026-01-04', '09:00', '10:30')
  const current = summariseWeek([customEvent], new Date(2026, 0, 4), () => 'Volunteering', categories)
  const previous = summariseWeek([], new Date(2025, 11, 28), undefined, categories)

  assert.equal(current.minutesByCategory.Volunteering, 90)
  assert.equal(current.days[0].minutesByCategory.Volunteering, 90)
  assert.equal(compareWeeks(current, previous).minutesByCategory.Volunteering, 90)
  assert.equal(current.totalMinutes, 90)
  assert.ok(['lavender', 'mint', 'blue', 'peach'].includes(categoryColor('Volunteering')))
})

test('keeps week and duration calculations aligned to local days across DST', () => {
  process.env.TZ = 'America/New_York'
  const weekStart = new Date(2026, 2, 8)
  const range = getWeekRange(new Date(2026, 2, 10), 0)
  const summary = summariseWeek([event('dst', '2026-03-08', '01:00', '03:00')], weekStart)
  assert.ok(range)
  assert.equal(range.start.getDate(), 8)
  assert.equal(range.end.getDate(), 14)
  assert.equal(summary.days[0].totalMinutes, 60)
  assert.equal(summary.days.length, 7)
})
