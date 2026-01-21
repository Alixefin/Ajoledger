'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { formatNaira, getInitials, calculatePercentage } from '@/lib/utils'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { format, startOfMonth, subMonths, addMonths } from 'date-fns'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Wallet,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import type { Member, Contribution } from '@/types/database'

interface ContributionsManagerProps {
  members: Member[]
  contributions: Contribution[]
  monthlyContribution: number
  currentMonthYear: string
}

export function ContributionsManager({
  members,
  contributions: initialContributions,
  monthlyContribution,
  currentMonthYear,
}: ContributionsManagerProps) {
  const [contributions, setContributions] = useState(initialContributions)
  const [selectedMonth, setSelectedMonth] = useState(new Date(currentMonthYear))
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [bulkLoading, setBulkLoading] = useState(false)

  const supabase = createClient()
  const monthStr = format(startOfMonth(selectedMonth), 'yyyy-MM-dd')

  const monthContributions = useMemo(() => {
    return contributions.filter((c) => c.month_year === monthStr)
  }, [contributions, monthStr])

  const contributionMap = useMemo(() => {
    const map = new Map<string, Contribution>()
    monthContributions.forEach((c) => map.set(c.member_id, c))
    return map
  }, [monthContributions])

  const totalExpected = members.length * monthlyContribution
  const totalCollected = monthContributions.reduce((sum, c) => sum + c.amount_paid, 0)
  const paidCount = monthContributions.filter((c) => c.amount_paid >= c.expected_amount).length
  const pendingCount = members.length - paidCount

  const handlePayment = async (memberId: string, amount: number) => {
    // Check rate limit
    const { isLimited, retryAfter } = checkRateLimit('api', RATE_LIMITS.api)
    if (isLimited) {
      toast.error(`Please wait ${retryAfter} seconds`)
      return
    }

    setIsLoading(memberId)

    try {
      const existingContribution = contributionMap.get(memberId)

      if (existingContribution) {
        const { error } = await supabase
          .from('contributions')
          .update({
            amount_paid: amount,
            paid_at: new Date().toISOString(),
          })
          .eq('id', existingContribution.id)

        if (error) throw error

        setContributions((prev) =>
          prev.map((c) =>
            c.id === existingContribution.id ? { ...c, amount_paid: amount } : c
          )
        )
      } else {
        const { data, error } = await supabase
          .from('contributions')
          .insert([
            {
              member_id: memberId,
              month_year: monthStr,
              amount_paid: amount,
              expected_amount: monthlyContribution,
            },
          ])
          .select()
          .single()

        if (error) throw error
        setContributions((prev) => [...prev, data])
      }

      toast.success('Payment recorded')
    } catch (error: unknown) {
      const err = error as { message?: string }
      toast.error(err.message || 'Failed to record payment')
    } finally {
      setIsLoading(null)
    }
  }

  const handleBulkMarkPaid = async () => {
    // Check rate limit for bulk operations
    const { isLimited, retryAfter } = checkRateLimit('bulk', RATE_LIMITS.bulk)
    if (isLimited) {
      toast.error(`Please wait ${retryAfter} seconds before bulk operations`)
      return
    }

    setBulkLoading(true)
    const unpaidMembers = members.filter((m) => !contributionMap.has(m.id))

    try {
      const newContributions = unpaidMembers.map((m) => ({
        member_id: m.id,
        month_year: monthStr,
        amount_paid: monthlyContribution,
        expected_amount: monthlyContribution,
      }))

      const { data, error } = await supabase
        .from('contributions')
        .insert(newContributions)
        .select()

      if (error) throw error

      setContributions((prev) => [...prev, ...(data || [])])
      toast.success(`Marked ${unpaidMembers.length} members as paid`)
    } catch (error: unknown) {
      const err = error as { message?: string }
      toast.error(err.message || 'Failed to bulk mark as paid')
    } finally {
      setBulkLoading(false)
    }
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setSelectedMonth((prev) =>
      direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Contributions</h1>
          <p className="text-muted-foreground mt-1">Record monthly member payments</p>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigateMonth('prev')}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="min-w-[160px] text-center">
            <span className="font-semibold">{format(selectedMonth, 'MMMM yyyy')}</span>
          </div>
          <Button variant="outline" size="icon" onClick={() => navigateMonth('next')}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Expected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNaira(totalExpected)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Collected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{formatNaira(totalCollected)}</div>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-2 bg-muted rounded-sm overflow-hidden">
                <div
                  className="h-full bg-success rounded-sm"
                  style={{ 
                    width: `${calculatePercentage(totalCollected, totalExpected)}%`,
                    transition: 'width 0.5s cubic-bezier(0.33, 1, 0.68, 1)'
                  }}
                />
              </div>
              <span className="text-xs font-medium">
                {calculatePercentage(totalCollected, totalExpected)}%
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paidCount}</div>
            <p className="text-xs text-muted-foreground">of {members.length} members</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">
              {formatNaira(totalExpected - totalCollected)} outstanding
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Actions */}
      {pendingCount > 0 && (
        <div className="flex justify-end">
          <Button variant="outline" onClick={handleBulkMarkPaid} isLoading={bulkLoading}>
            <Check className="w-4 h-4 mr-2" />
            Mark All Unpaid as Paid
          </Button>
        </div>
      )}

      {/* Contributions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Member Payments</CardTitle>
          <CardDescription>
            Expected contribution: {formatNaira(monthlyContribution)} per member
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Member</TableHead>
                  <TableHead>Expected</TableHead>
                  <TableHead>Amount Paid</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <p className="text-muted-foreground">No active members</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  members.map((member) => {
                    const contribution = contributionMap.get(member.id)
                    const isPaid = contribution && contribution.amount_paid >= monthlyContribution
                    const isPartial =
                      contribution &&
                      contribution.amount_paid > 0 &&
                      contribution.amount_paid < monthlyContribution

                    return (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs rounded-lg">
                                {getInitials(member.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{member.full_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{formatNaira(monthlyContribution)}</TableCell>
                        <TableCell>
                          {contribution ? (
                            <span className="font-medium">
                              {formatNaira(contribution.amount_paid)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {isPaid ? (
                            <Badge variant="success">Paid</Badge>
                          ) : isPartial ? (
                            <Badge variant="warning">Partial</Badge>
                          ) : (
                            <Badge variant="secondary">Pending</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {!isPaid && (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={isLoading === member.id}
                              onClick={() => handlePayment(member.id, monthlyContribution)}
                            >
                              {isLoading === member.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Check className="w-4 h-4" />
                              )}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
