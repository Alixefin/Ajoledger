'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Wallet, AlertCircle } from 'lucide-react'
import { loginSchema, validateForm } from '@/lib/validations'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors([])

    // Check rate limit
    const { isLimited, retryAfter } = checkRateLimit('auth', RATE_LIMITS.auth)
    if (isLimited) {
      toast.error(`Too many attempts. Please wait ${retryAfter} seconds.`)
      return
    }

    // Validate input
    const validation = validateForm(loginSchema, { email, password })
    if (!validation.success) {
      setErrors(validation.errors)
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: validation.data.email,
        password: validation.data.password,
      })

      if (error) {
        toast.error('Invalid email or password')
        return
      }

      toast.success('Welcome back')
      router.push('/')
      router.refresh()
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#fafafa]">
      {/* Subtle background pattern */}
      <div className="fixed inset-0 pattern-dots pointer-events-none" />

      <div className="w-full max-w-md animate-fade-in relative z-10">
        {/* Logo and branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-lg bg-primary/10 mb-4">
            <Wallet className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">AjoLedger</h1>
          <p className="text-muted-foreground mt-1 text-sm">Cooperative Savings Manager</p>
        </div>

        <Card className="border shadow-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-lg font-semibold text-center">
              Treasurer Login
            </CardTitle>
            <CardDescription className="text-center text-sm">
              Enter your credentials to access the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {errors.length > 0 && (
                <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                  <div className="flex gap-2">
                    <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                    <div className="text-sm text-destructive">
                      {errors.map((error, i) => (
                        <p key={i}>{error}</p>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="treasurer@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="email"
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                  className="h-10"
                />
              </div>
              <Button
                type="submit"
                className="w-full h-10 text-sm font-medium"
                isLoading={isLoading}
                loadingText="Signing in..."
              >
                Sign In
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Only authorized treasurers can access this app
        </p>
      </div>
    </div>
  )
}
