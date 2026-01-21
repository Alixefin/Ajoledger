import { createClient } from '@/lib/supabase/server'
import { MembersList } from './members-list'

export default async function MembersPage() {
  const supabase = await createClient()

  const [{ data: members }, { data: settings }] = await Promise.all([
    supabase.from('members').select('*').order('created_at', { ascending: false }),
    supabase.from('group_settings').select('monthly_contribution').single(),
  ])

  // Get total contributions for each member
  const memberIds = members?.map((m) => m.id) || []
  const { data: contributions } = await supabase
    .from('contributions')
    .select('member_id, amount_paid')
    .in('member_id', memberIds)

  // Calculate totals per member
  const memberTotals = new Map<string, number>()
  contributions?.forEach((c) => {
    const current = memberTotals.get(c.member_id) || 0
    memberTotals.set(c.member_id, current + c.amount_paid)
  })

  const membersWithTotals = members?.map((m) => ({
    ...m,
    total_paid: memberTotals.get(m.id) || 0,
  })) || []

  return (
    <MembersList
      initialMembers={membersWithTotals}
      monthlyContribution={settings?.monthly_contribution || 0}
    />
  )
}
