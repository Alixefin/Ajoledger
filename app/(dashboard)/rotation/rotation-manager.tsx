'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { formatNaira, getInitials } from '@/lib/utils'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { format, addMonths } from 'date-fns'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Save, Calendar, Gift, CheckCircle2, Clock } from 'lucide-react'
import type { Member, GroupSettings } from '@/types/database'

interface RotationManagerProps {
  initialMembers: Member[]
  settings: GroupSettings | null
  payouts: { member_id: string; month_year: string }[]
}

interface SortableMemberProps {
  member: Member
  index: number
  hasReceived: boolean
  scheduledMonth: Date | null
  monthlyAmount: number
}

function SortableMember({
  member,
  index,
  hasReceived,
  scheduledMonth,
  monthlyAmount,
}: SortableMemberProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: member.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 0.2s cubic-bezier(0.33, 1, 0.68, 1)',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-4 p-4 bg-card border rounded-md ${
        isDragging ? 'opacity-50 shadow-md' : ''
      } ${hasReceived ? 'bg-success/5 border-success/20' : ''}`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 rounded-md hover:bg-muted"
        style={{ transition: 'background-color 0.15s cubic-bezier(0.33, 1, 0.68, 1)' }}
      >
        <GripVertical className="w-5 h-5 text-muted-foreground" />
      </button>

      <div
        className={`w-8 h-8 rounded-md flex items-center justify-center text-sm font-bold ${
          hasReceived ? 'bg-success text-success-foreground' : 'bg-primary/10 text-primary'
        }`}
      >
        {index + 1}
      </div>

      <Avatar className="h-10 w-10">
        <AvatarFallback className="bg-primary/10 text-primary rounded-lg">
          {getInitials(member.full_name)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{member.full_name}</p>
        <p className="text-sm text-muted-foreground">{member.phone}</p>
      </div>

      <div className="hidden sm:flex flex-col items-end">
        {scheduledMonth && (
          <span className="text-sm font-medium">{format(scheduledMonth, 'MMM yyyy')}</span>
        )}
        <span className="text-xs text-muted-foreground">{formatNaira(monthlyAmount)}</span>
      </div>

      {hasReceived ? (
        <Badge variant="success" className="gap-1">
          <CheckCircle2 className="w-3 h-3" />
          <span className="hidden sm:inline">Received</span>
        </Badge>
      ) : (
        <Badge variant="secondary" className="gap-1">
          <Clock className="w-3 h-3" />
          <span className="hidden sm:inline">Pending</span>
        </Badge>
      )}
    </div>
  )
}

export function RotationManager({ initialMembers, settings, payouts }: RotationManagerProps) {
  const [members, setMembers] = useState(initialMembers)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const supabase = createClient()

  const receivedMemberIds = new Set(payouts.map((p) => p.member_id))
  const cycleStartDate = settings?.cycle_start_date
    ? new Date(settings.cycle_start_date)
    : new Date()
  const monthlyAmount = members.length * (settings?.monthly_contribution || 0)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setMembers((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
      setHasChanges(true)
    }
  }

  const handleSave = async () => {
    // Check rate limit
    const { isLimited, retryAfter } = checkRateLimit('form', RATE_LIMITS.form)
    if (isLimited) {
      toast.error(`Please wait ${retryAfter} seconds`)
      return
    }

    setIsSaving(true)

    try {
      const updates = members.map((member, index) => ({
        id: member.id,
        rotation_order: index + 1,
      }))

      for (const update of updates) {
        const updateData = { rotation_order: update.rotation_order }
        const { error } = await supabase
          .from('members')
          .update(updateData)
          .eq('id', update.id)

        if (error) throw error
      }

      toast.success('Rotation order saved')
      setHasChanges(false)
    } catch (error: unknown) {
      const err = error as { message?: string }
      toast.error(err.message || 'Failed to save rotation order')
    } finally {
      setIsSaving(false)
    }
  }

  const completedCount = members.filter((m) => receivedMemberIds.has(m.id)).length
  const pendingCount = members.length - completedCount
  const progressPercent = members.length > 0 ? Math.round((completedCount / members.length) * 100) : 0

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Rotation Order</h1>
          <p className="text-muted-foreground mt-1">Drag and drop to reorder the payout schedule</p>
        </div>

        <Button onClick={handleSave} disabled={!hasChanges} isLoading={isSaving}>
          <Save className="w-4 h-4 mr-2" />
          Save Order
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Cycle Started
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{format(cycleStartDate, 'MMM yyyy')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{completedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Gift className="w-4 h-4" />
              Monthly Payout
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{formatNaira(monthlyAmount)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Progress */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Cycle Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1 h-3 bg-muted rounded-sm overflow-hidden">
              <div
                className="h-full bg-success rounded-sm"
                style={{ 
                  width: `${progressPercent}%`,
                  transition: 'width 0.5s cubic-bezier(0.33, 1, 0.68, 1)'
                }}
              />
            </div>
            <span className="font-bold text-lg">{progressPercent}%</span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {completedCount} of {members.length} members have received their payout
          </p>
        </CardContent>
      </Card>

      {/* Rotation List */}
      <Card>
        <CardHeader>
          <CardTitle>Payout Schedule</CardTitle>
          <CardDescription>Drag members to change their position in the rotation</CardDescription>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No members to display</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add members to start planning the rotation
              </p>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={members.map((m) => m.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {members.map((member, index) => (
                    <SortableMember
                      key={member.id}
                      member={member}
                      index={index}
                      hasReceived={receivedMemberIds.has(member.id)}
                      scheduledMonth={addMonths(cycleStartDate, index)}
                      monthlyAmount={monthlyAmount}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      {hasChanges && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 lg:left-auto lg:translate-x-0 lg:right-6 z-50">
          <Card className="shadow-md border-primary/20">
            <CardContent className="flex items-center gap-4 p-4">
              <p className="text-sm font-medium">You have unsaved changes</p>
              <Button onClick={handleSave} isLoading={isSaving} size="sm">
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
