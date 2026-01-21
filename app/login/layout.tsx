import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If user is already logged in, redirect to dashboard
  if (user) {
    redirect('/')
  }

  return <>{children}</>
}
