import { createClient } from '@/lib/supabase/server'
import { SettingsForm } from './settings-form'

export default async function SettingsPage() {
  const supabase = await createClient()

  const { data: settings } = await supabase.from('group_settings').select('*').single()

  return <SettingsForm initialSettings={settings} />
}
