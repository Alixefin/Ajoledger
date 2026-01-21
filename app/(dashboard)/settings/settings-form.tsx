'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { formatNaira } from '@/lib/utils'
import { settingsSchema, validateForm } from '@/lib/validations'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { format } from 'date-fns'
import { Save, Settings, Calendar, Wallet, Users, AlertCircle } from 'lucide-react'
import type { GroupSettings } from '@/types/database'

interface SettingsFormProps {
  initialSettings: GroupSettings | null
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [settings, setSettings] = useState(initialSettings)
  const [isLoading, setIsLoading] = useState(false)
  const [formErrors, setFormErrors] = useState<string[]>([])
  const [groupName, setGroupName] = useState(settings?.group_name || '')
  const [monthlyContribution, setMonthlyContribution] = useState(
    settings?.monthly_contribution?.toString() || ''
  )
  const [cycleStartDate, setCycleStartDate] = useState(
    settings?.cycle_start_date || format(new Date(), 'yyyy-MM-dd')
  )

  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormErrors([])

    // Check rate limit
    const { isLimited, retryAfter } = checkRateLimit('form', RATE_LIMITS.form)
    if (isLimited) {
      toast.error(`Please wait ${retryAfter} seconds`)
      return
    }

    // Validate input
    const validation = validateForm(settingsSchema, {
      group_name: groupName,
      monthly_contribution: parseInt(monthlyContribution) || 0,
      cycle_start_date: cycleStartDate,
    })

    if (!validation.success) {
      setFormErrors(validation.errors)
      return
    }

    setIsLoading(true)

    try {
      if (settings?.id) {
        const { error } = await supabase
          .from('group_settings')
          .update(validation.data)
          .eq('id', settings.id)

        if (error) throw error
      } else {
        const { data: newSettings, error } = await supabase
          .from('group_settings')
          .insert([validation.data])
          .select()
          .single()

        if (error) throw error
        setSettings(newSettings)
      }

      toast.success('Settings saved')
    } catch (error: unknown) {
      const err = error as { message?: string }
      toast.error(err.message || 'Failed to save settings')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
          <Settings className="w-7 h-7" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">Configure your group settings</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Group Configuration</CardTitle>
            <CardDescription>
              These settings affect how contributions and payouts are calculated
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {formErrors.length > 0 && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                <div className="flex gap-2">
                  <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                  <div className="text-sm text-destructive">
                    {formErrors.map((error, i) => (
                      <p key={i}>{error}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Group Name */}
            <div className="space-y-2">
              <Label htmlFor="group_name" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Group Name
              </Label>
              <Input
                id="group_name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="My Ajo Group"
                maxLength={100}
              />
              <p className="text-sm text-muted-foreground">
                The name of your cooperative group
              </p>
            </div>

            <Separator />

            {/* Monthly Contribution */}
            <div className="space-y-2">
              <Label htmlFor="monthly_contribution" className="flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                Monthly Contribution (Naira)
              </Label>
              <Input
                id="monthly_contribution"
                type="number"
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(e.target.value)}
                placeholder="10000"
                min={100}
                max={10000000}
              />
              <p className="text-sm text-muted-foreground">
                The fixed amount each member contributes monthly. Currently:{' '}
                {formatNaira(parseInt(monthlyContribution) || 0)}
              </p>
            </div>

            <Separator />

            {/* Cycle Start Date */}
            <div className="space-y-2">
              <Label htmlFor="cycle_start_date" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Cycle Start Date
              </Label>
              <Input
                id="cycle_start_date"
                type="date"
                value={cycleStartDate}
                onChange={(e) => setCycleStartDate(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                The date when the current rotation cycle started
              </p>
            </div>

            <Separator />

            {/* Summary */}
            <div className="p-4 bg-muted/50 rounded-md">
              <h4 className="font-medium mb-2">Summary</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>
                  Each member contributes {formatNaira(parseInt(monthlyContribution) || 0)} per
                  month
                </li>
                <li>
                  Cycle started on{' '}
                  {cycleStartDate ? format(new Date(cycleStartDate), 'MMMM d, yyyy') : 'Not set'}
                </li>
              </ul>
            </div>

            {/* Submit Button */}
            <Button type="submit" isLoading={isLoading} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
