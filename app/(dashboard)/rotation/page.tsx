import { createClient } from '@/lib/supabase/server'
import { RotationManager } from './rotation-manager'

export default async function RotationPage() {
  const supabase = await createClient()

  const [{ data: members }, { data: settings }, { data: payouts }] = await Promise.all([
    supabase
      .from('members')
      .select('*')
      .eq('status', 'active')
      .order('rotation_order', { ascending: true, nullsFirst: false }),
    supabase.from('group_settings').select('*').single(),
    supabase.from('payouts').select('member_id, month_year').order('month_year', { ascending: true }),
  ])

  return <RotationManager initialMembers={members || []} settings={settings} payouts={payouts || []} />
}
