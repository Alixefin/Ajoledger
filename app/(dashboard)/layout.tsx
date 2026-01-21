import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch group settings
  const { data: settings } = await supabase
    .from('group_settings')
    .select('group_name')
    .single()

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Sidebar groupName={settings?.group_name} />
      <main className="lg:pl-64">
        <div className="min-h-screen p-4 pt-16 lg:pt-6 lg:p-8">{children}</div>
      </main>
    </div>
  )
}
