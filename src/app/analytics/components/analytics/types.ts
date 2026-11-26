import type { Category, WeekSummary } from '../../../../lib/analytics'

export interface AnalyticsDataProps {
  current: WeekSummary
  compared: WeekSummary
  compareEnabled: boolean
}

export type CategoryOverrides = Record<string, Category>
