'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { formatNaira, getInitials } from '@/lib/utils'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { format, startOfMonth, subMonths, addMonths } from 'date-fns'
import {
  Plus,
  Gift,
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  Banknote,
} from 'lucide-react'
import type { Member, PayoutWithMember } from '@/types/database'

interface PayoutsManagerProps {
  members: Member[]
  payouts: PayoutWithMember[]
  monthlyContribution: number
  currentMonthYear: string
}

export function PayoutsManager({
  members,
  payouts: initialPayouts,
  monthlyContribution,
  currentMonthYear,
}: PayoutsManagerProps) {
  const [payouts, setPayouts] = useState(initialPayouts)
  const [selectedMonth, setSelectedMonth] = useState(new Date(currentMonthYear))
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedMemberId, setSelectedMemberId] = useState<string>('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')

  const supabase = createClient()
  const monthStr = format(startOfMonth(selectedMonth), 'yyyy-MM-dd')
  const defaultAmount = members.length * monthlyContribution

  const paidOutMemberIds = new Set(payouts.map((p) => p.member_id))
  const nextRecipient = members.find((m) => m.rotation_order && !paidOutMemberIds.has(m.id))
  const monthPayouts = payouts.filter((p) => p.month_year === monthStr)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMemberId) {
      toast.error('Please select a member')
      return
    }

    // Check rate limit
    const { isLimited, retryAfter } = checkRateLimit('form', RATE_LIMITS.form)
    if (isLimited) {
      toast.error(`Please wait ${retryAfter} seconds`)
      return
    }

    // Validate amount
    const payoutAmount = parseInt(amount) || defaultAmount
    if (payoutAmount <= 0 || payoutAmount > 100000000) {
      toast.error('Please enter a valid amount')
      return
    }

    setIsLoading(true)

    try {
      const { data, error } = await supabase
        .from('payouts')
        .insert([
          {
            member_id: selectedMemberId,
            month_year: monthStr,
            amount: payoutAmount,
            note: note.trim() || null,
          },
        ])
        .select('*, member:members(full_name)')
        .single()

      if (error) throw error

      setPayouts((prev) => [data, ...prev])
      toast.success('Payout recorded')
      handleCloseDialog()
    } catch (error: unknown) {
      const err = error as { message?: string }
      toast.error(err.message || 'Failed to record payout')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setSelectedMemberId('')
    setAmount('')
    setNote('')
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setSelectedMonth((prev) =>
      direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
    )
  }

  const totalPaidOut = payouts.reduce((sum, p) => sum + p.amount, 0)
  const payoutsThisMonth = monthPayouts.reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Payouts</h1>
          <p className="text-muted-foreground mt-1">Record monthly rotating payouts</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Record Payout
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Record Payout</DialogTitle>
                <DialogDescription>
                  Record a payout for {format(selectedMonth, 'MMMM yyyy')}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {/* Month Selection */}
                <div className="flex items-center justify-center gap-2 p-3 bg-muted rounded-md">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => navigateMonth('prev')}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="font-medium min-w-[140px] text-center">
                    {format(selectedMonth, 'MMMM yyyy')}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => navigateMonth('next')}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>

                {/* Member Selection */}
                <div className="space-y-2">
                  <Label htmlFor="member">Recipient *</Label>
                  <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select recipient" />
                    </SelectTrigger>
                    <SelectContent>
                      {nextRecipient && (
                        <SelectItem value={nextRecipient.id}>
                          <div className="flex items-center gap-2">
                            <Badge variant="success" className="text-[10px]">
                              Next
                            </Badge>
                            {nextRecipient.full_name}
                          </div>
                        </SelectItem>
                      )}
                      {members
                        .filter((m) => m.id !== nextRecipient?.id)
                        .map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            <div className="flex items-center gap-2">
                              {paidOutMemberIds.has(member.id) && (
                                <Badge variant="secondary" className="text-[10px]">
                                  Received
                                </Badge>
                              )}
                              {member.full_name}
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Amount */}
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (Naira)</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={defaultAmount.toString()}
                    min={0}
                    max={100000000}
                  />
                  <p className="text-xs text-muted-foreground">
                    Default: {formatNaira(defaultAmount)} ({members.length} members x{' '}
                    {formatNaira(monthlyContribution)})
                  </p>
                </div>

                {/* Note */}
                <div className="space-y-2">
                  <Label htmlFor="note">Note (optional)</Label>
                  <Textarea
                    id="note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Any additional notes..."
                    rows={3}
                    maxLength={500}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={isLoading} disabled={!selectedMemberId}>
                  Record Payout
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Gift className="w-4 h-4" />
              Total Payouts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payouts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Banknote className="w-4 h-4" />
              Total Paid Out
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNaira(totalPaidOut)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNaira(payoutsThisMonth)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <User className="w-4 h-4" />
              Next Recipient
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">
              {nextRecipient?.full_name || 'All received'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payout History */}
      <Card>
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
          <CardDescription>All recorded payouts</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Paid At</TableHead>
                  <TableHead className="hidden md:table-cell">Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Gift className="w-8 h-8 text-muted-foreground" />
                        <p className="text-muted-foreground">No payouts recorded yet</p>
                        <Button variant="link" onClick={() => setIsDialogOpen(true)}>
                          Record first payout
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  payouts.map((payout) => (
                    <TableRow key={payout.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs rounded-lg">
                              {getInitials(payout.member?.full_name || 'Unknown')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">
                            {payout.member?.full_name || 'Unknown'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{format(new Date(payout.month_year), 'MMMM yyyy')}</TableCell>
                      <TableCell className="font-medium">{formatNaira(payout.amount)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(payout.paid_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="hidden md:table-cell max-w-[200px] truncate">
                        {payout.note || '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
