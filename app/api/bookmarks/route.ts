import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase(req: NextRequest) {
  const authHeader = req.headers.get('authorization') ?? ''
  const token = authHeader.replace('Bearer ', '')
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )
}

export async function GET(req: NextRequest) {
  const supabase = getSupabase(req)
  const mona_cd = req.nextUrl.searchParams.get('mona_cd')

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ bookmarked: false })

  if (mona_cd) {
    const { data } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('user_id', user.id)
      .eq('mona_cd', mona_cd)
      .maybeSingle()
    return NextResponse.json({ bookmarked: !!data })
  }

  const { data } = await supabase
    .from('bookmarks')
    .select('mona_cd, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase(req)
  const { mona_cd } = await req.json()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  await supabase.from('bookmarks').upsert({ user_id: user.id, mona_cd })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const supabase = getSupabase(req)
  const mona_cd = req.nextUrl.searchParams.get('mona_cd')

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  await supabase.from('bookmarks').delete().eq('user_id', user.id).eq('mona_cd', mona_cd)
  return NextResponse.json({ ok: true })
}
