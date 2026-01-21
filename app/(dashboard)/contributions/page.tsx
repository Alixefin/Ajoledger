import { createClient } from '@/lib/supabase/server'
import { ContributionsManager } from './contributions-manager'
import { getMonthYearDate } from '@/lib/utils'

export default async function ContributionsPage() {
  const supabase = await createClient()
  const currentMonthYear = getMonthYearDate(new Date())

  const [{ data: members }, { data: settings }, { data: contributions }] = await Promise.all([
    supabase.from('members').select('*').eq('status', 'active').order('full_name'),
    supabase.from('group_settings').select('monthly_contribution').single(),
    supabase.from('contributions').select('*'),
  ])

  return (
    <ContributionsManager
      members={members || []}
      contributions={contributions || []}
      monthlyContribution={settings?.monthly_contribution || 0}
      currentMonthYear={currentMonthYear}
    />
  )
}
