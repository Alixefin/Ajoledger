import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { memberSchema, validateForm } from '@/lib/validations'

// Rate limit tracking (in production, use Redis or similar)
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
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    if (!checkServerRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Auth check
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate body
    const body = await request.json()
    const validation = validateForm(memberSchema, body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      )
    }

    // Insert member
    const { data, error } = await supabase
      .from('members')
      .insert([validation.data])
      .select()
      .single()

    if (error) {
      console.error('Member creation error:', error)
      return NextResponse.json(
        { error: 'Failed to create member' },
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

export async function PUT(request: NextRequest) {
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
    const { id, ...updateData } = body

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 })
    }

    const validation = validateForm(memberSchema.partial(), updateData)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('members')
      .update(validation.data)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Member update error:', error)
      return NextResponse.json(
        { error: 'Failed to update member' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
