import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const revalidate = 3600

export async function GET(req: NextRequest) {
    const region = req.nextUrl.searchParams.get('region') ?? ''
    const name = req.nextUrl.searchParams.get('name') ?? ''

    let query = supabase.from('member_stats').select('*')

    if (region) {
        query = query.ilike('orig_nm', `%${region}%`)
    }
    if (name) {
        query = query.ilike('hg_nm', `%${name}%`)
    }

    const { data, error } = await query

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, {
        headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400' }
    })
}
