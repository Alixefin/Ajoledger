import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatNaira, calculatePercentage, getMonthYearDate } from '@/lib/utils'
import { format, differenceInMonths, addMonths } from 'date-fns'
import Link from 'next/link'
import {
  Users,
  Wallet,
  TrendingUp,
  AlertTriangle,
  Gift,
  ArrowRight,
  Plus,
  Calendar,
  Target,
  CheckCircle2,
} from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const currentMonthYear = getMonthYearDate(new Date())

  // Fetch all data in parallel
  const [
    { data: settings },
    { data: members },
    { data: contributions },
    { data: payouts },
  ] = await Promise.all([
    supabase.from('group_settings').select('*').single(),
    supabase.from('members').select('*').order('rotation_order', { ascending: true }),
    supabase.from('contributions').select('*').eq('month_year', currentMonthYear),
    supabase.from('payouts').select('*, member:members(full_name)').order('month_year', { ascending: false }),
  ])

  const activeMembers = members?.filter((m) => m.status === 'active') || []
  const totalMembers = activeMembers.length
  const monthlyTarget = totalMembers * (settings?.monthly_contribution || 0)

  // Calculate current month contributions
  const totalCollected = contributions?.reduce((sum, c) => sum + c.amount_paid, 0) || 0
  const collectionPercentage = calculatePercentage(totalCollected, monthlyTarget)

  // Find defaulters
  const paidMemberIds = new Set(contributions?.map((c) => c.member_id) || [])
  const defaulters = activeMembers.filter((m) => !paidMemberIds.has(m.id))

  // Calculate cycle progress
  const cycleStartDate = settings?.cycle_start_date ? new Date(settings.cycle_start_date) : new Date()
  const monthsSinceStart = Math.max(0, differenceInMonths(new Date(), cycleStartDate) + 1)
  const cycleLength = totalMembers || 12

  // Find next recipient
  const paidOutMemberIds = new Set(payouts?.map((p) => p.member_id) || [])
  const nextRecipient = activeMembers.find(
    (m) => m.rotation_order && !paidOutMemberIds.has(m.id)
  )

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/members">
              <Plus className="w-4 h-4 mr-2" />
              Add Member
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/contributions">
              <Wallet className="w-4 h-4 mr-2" />
              Record Payments
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="animate-fade-in">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Members
            </CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMembers}</div>
            <p className="text-xs text-muted-foreground mt-1">Active participants</p>
          </CardContent>
        </Card>

        <Card className="animate-fade-in animation-delay-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monthly Target
            </CardTitle>
            <Target className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNaira(monthlyTarget)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatNaira(settings?.monthly_contribution || 0)} per member
            </p>
          </CardContent>
        </Card>

        <Card className="animate-fade-in animation-delay-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Collected
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNaira(totalCollected)}</div>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-2 bg-muted rounded-sm overflow-hidden">
                <div
                  className="h-full bg-primary rounded-sm"
                  style={{ 
                    width: `${Math.min(collectionPercentage, 100)}%`,
                    transition: 'width 0.5s cubic-bezier(0.33, 1, 0.68, 1)'
                  }}
                />
              </div>
              <span className="text-xs font-medium">{collectionPercentage}%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in animation-delay-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Outstanding
            </CardTitle>
            <AlertTriangle className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNaira(Math.max(0, monthlyTarget - totalCollected))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {defaulters.length} member{defaulters.length !== 1 ? 's' : ''} pending
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Cycle Progress */}
        <Card className="lg:col-span-2 animate-fade-in animation-delay-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Cycle Progress
                </CardTitle>
                <CardDescription className="mt-1">
                  Started {format(cycleStartDate, 'MMMM yyyy')}
                </CardDescription>
              </div>
              <Badge variant="secondary" className="text-sm">
                Month {Math.min(monthsSinceStart, cycleLength)} of {cycleLength}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {/* Progress bar */}
            <div className="space-y-2 mb-6">
              <div className="h-3 bg-muted rounded-sm overflow-hidden">
                <div
                  className="h-full bg-primary rounded-sm"
                  style={{
                    width: `${calculatePercentage(monthsSinceStart, cycleLength)}%`,
                    transition: 'width 0.5s cubic-bezier(0.33, 1, 0.68, 1)'
                  }}
                />
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Cycle Start</span>
                <span>
                  Est. End: {format(addMonths(cycleStartDate, cycleLength - 1), 'MMMM yyyy')}
                </span>
              </div>
            </div>

            {/* Next Recipient */}
            {nextRecipient && (
              <div className="p-4 rounded-lg bg-accent/50 border border-accent">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Gift className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Next Payout Recipient</p>
                      <p className="font-semibold">{nextRecipient.full_name}</p>
                    </div>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/payouts">
                      Record Payout
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </div>
            )}

            {!nextRecipient && totalMembers > 0 && (
              <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                  <p className="text-success font-medium">
                    All members have received their payouts this cycle
                  </p>
                </div>
              </div>
            )}

            {totalMembers === 0 && (
              <div className="p-4 rounded-lg bg-muted border text-center">
                <p className="text-muted-foreground">
                  Add members to start tracking the rotation
                </p>
                <Button asChild size="sm" className="mt-2">
                  <Link href="/members">Add Members</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Defaulters List */}
        <Card className="animate-fade-in animation-delay-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Pending Payments
            </CardTitle>
            <CardDescription>{format(new Date(), 'MMMM yyyy')}</CardDescription>
          </CardHeader>
          <CardContent>
            {defaulters.length === 0 ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-lg bg-success/10 mx-auto mb-3 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-success" />
                </div>
                <p className="font-medium text-success">All Paid</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Everyone has contributed this month
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {defaulters.slice(0, 5).map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50"
                    style={{ transition: 'background-color 0.15s cubic-bezier(0.33, 1, 0.68, 1)' }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center text-sm font-medium text-warning">
                        {member.full_name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{member.full_name}</p>
                        <p className="text-xs text-muted-foreground">{member.phone}</p>
                      </div>
                    </div>
                    <Badge variant="warning" className="text-xs">
                      Pending
                    </Badge>
                  </div>
                ))}
                {defaulters.length > 5 && (
                  <p className="text-sm text-muted-foreground text-center pt-2">
                    +{defaulters.length - 5} more
                  </p>
                )}
                <Separator className="my-2" />
                <Button asChild variant="outline" className="w-full" size="sm">
                  <Link href="/contributions">
                    Record Payments
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="animate-fade-in animation-delay-400">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks for managing your group</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
              <Link href="/members">
                <Users className="w-5 h-5" />
                <span className="text-sm">View Members</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
              <Link href="/contributions">
                <Wallet className="w-5 h-5" />
                <span className="text-sm">Record Payments</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
              <Link href="/payouts">
                <Gift className="w-5 h-5" />
                <span className="text-sm">Record Payout</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
              <Link href="/rotation">
                <Calendar className="w-5 h-5" />
                <span className="text-sm">Rotation Order</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
