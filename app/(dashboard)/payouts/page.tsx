import { createClient } from '@/lib/supabase/server'
import { PayoutsManager } from './payouts-manager'
import { getMonthYearDate } from '@/lib/utils'

export default async function PayoutsPage() {
  const supabase = await createClient()
  const currentMonthYear = getMonthYearDate(new Date())

  const [{ data: members }, { data: settings }, { data: payouts }] = await Promise.all([
    supabase
      .from('members')
      .select('*')
      .eq('status', 'active')
      .order('rotation_order', { ascending: true }),
    supabase.from('group_settings').select('monthly_contribution').single(),
    supabase
      .from('payouts')
      .select('*, member:members(full_name)')
      .order('month_year', { ascending: false }),
  ])

  return (
    <PayoutsManager
      members={members || []}
      payouts={payouts || []}
      monthlyContribution={settings?.monthly_contribution || 0}
      currentMonthYear={currentMonthYear}
    />
  )
}
