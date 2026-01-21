'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  LayoutDashboard,
  Users,
  Wallet,
  Gift,
  ListOrdered,
  LogOut,
  Menu,
  X,
  Settings,
} from 'lucide-react'
import { useState } from 'react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Members', href: '/members', icon: Users },
  { name: 'Contributions', href: '/contributions', icon: Wallet },
  { name: 'Payouts', href: '/payouts', icon: Gift },
  { name: 'Rotation Order', href: '/rotation', icon: ListOrdered },
]

interface SidebarProps {
  groupName?: string
}

export function Sidebar({ groupName = 'My Ajo Group' }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await supabase.auth.signOut()
      toast.success('Signed out')
      router.push('/login')
      router.refresh()
    } catch {
      toast.error('Error signing out')
    } finally {
      setIsSigningOut(false)
    }
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-foreground">AjoLedger</h1>
            <p className="text-xs text-muted-foreground truncate max-w-[140px]">
              {groupName}
            </p>
          </div>
        </div>
      </div>

      <Separator className="mx-4 w-auto" />

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
                style={{ transition: 'background-color 0.15s cubic-bezier(0.33, 1, 0.68, 1), color 0.15s cubic-bezier(0.33, 1, 0.68, 1)' }}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 mt-auto space-y-2">
        <Link
          href="/settings"
          onClick={() => setMobileOpen(false)}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium',
            pathname === '/settings'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          )}
          style={{ transition: 'background-color 0.15s cubic-bezier(0.33, 1, 0.68, 1), color 0.15s cubic-bezier(0.33, 1, 0.68, 1)' }}
        >
          <Settings className="w-5 h-5" />
          Settings
        </Link>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 px-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={handleSignOut}
          disabled={isSigningOut}
        >
          <LogOut className="w-5 h-5" />
          {isSigningOut ? 'Signing out...' : 'Sign Out'}
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
          style={{ transition: 'opacity 0.2s cubic-bezier(0.33, 1, 0.68, 1)' }}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 bg-white border-r lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{ transition: 'transform 0.2s cubic-bezier(0.33, 1, 0.68, 1)' }}
      >
        <SidebarContent />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:w-64 bg-white border-r">
        <SidebarContent />
      </aside>
    </>
  )
}
