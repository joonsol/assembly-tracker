import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase(req: NextRequest) {
  const authHeader = req.headers.get('authorization') ?? ''
  const token = authHeader.replace('Bearer ', '').trim()
  if (!token) {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )
}

// 리뷰 목록 + 평균 평점 조회
export async function GET(req: NextRequest) {
  const mona_cd = req.nextUrl.searchParams.get('mona_cd')
  if (!mona_cd) return NextResponse.json({ error: 'mona_cd required' }, { status: 400 })

  const supabase = getSupabase(req)

  const { data } = await supabase
    .from('reviews')
    .select('id, user_id, rating, comment, created_at')
    .eq('mona_cd', mona_cd)
    .order('created_at', { ascending: false })
    .limit(20)

  const reviews = data ?? []
  const avg = reviews.length > 0
    ? Math.round(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length * 10) / 10
    : null

  return NextResponse.json({ reviews, avg, count: reviews.length })
}

// 리뷰 작성/수정 (upsert)
export async function POST(req: NextRequest) {
  const supabase = getSupabase(req)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { mona_cd, rating, comment } = await req.json()
  if (!mona_cd || rating == null) return NextResponse.json({ error: 'invalid' }, { status: 400 })

  const { error } = await supabase.from('reviews').upsert(
    { user_id: user.id, mona_cd, rating, comment: comment ?? '' },
    { onConflict: 'user_id,mona_cd' }
  )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// 리뷰 삭제
export async function DELETE(req: NextRequest) {
  const supabase = getSupabase(req)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const mona_cd = req.nextUrl.searchParams.get('mona_cd')
  await supabase.from('reviews').delete().eq('user_id', user.id).eq('mona_cd', mona_cd)
  return NextResponse.json({ ok: true })
}
