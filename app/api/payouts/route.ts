import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { payoutSchema, validateForm } from '@/lib/validations'

const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function checkServerRateLimit(ip: string, limit = 30, windowMs = 60000): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (entry.count >= limit) {
    return false
  }

  entry.count++
  return true
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    if (!checkServerRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = validateForm(payoutSchema, body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      )
    }

    // Check if member already received payout this cycle
    const { data: existingPayout } = await supabase
      .from('payouts')
      .select('id')
      .eq('member_id', validation.data.member_id)
      .single()

    if (existingPayout) {
      return NextResponse.json(
        { error: 'This member has already received a payout this cycle' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('payouts')
      .insert([validation.data])
      .select('*, member:members(full_name)')
      .single()

    if (error) {
      console.error('Payout creation error:', error)
      return NextResponse.json(
        { error: 'Failed to record payout' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
