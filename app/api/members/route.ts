import { NextRequest, NextResponse } from 'next/server'

export const revalidate = 3600

export async function GET(req: NextRequest) {
    const API_KEY = process.env.ASSEMBLY_API_KEY
    const region = req.nextUrl.searchParams.get('region') ?? ''
    const name = req.nextUrl.searchParams.get('name') ?? ''

    const url = `https://open.assembly.go.kr/portal/openapi/nwvrqwxyaytdsfvhu?KEY=${API_KEY}&Type=json&pIndex=1&pSize=300&ORIG_NM=${encodeURIComponent(region)}&HG_NM=${encodeURIComponent(name)}`

    const res = await fetch(url, { next: { revalidate: 3600 } })
    const text = await res.text()

    if (!text || text.trim() === '') {
        return NextResponse.json({ nwvrqwxyaytdsfvhu: [{}, { row: [] }] })
    }

    const data = JSON.parse(text)
    return NextResponse.json(data, {
        headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400' }
    })
}