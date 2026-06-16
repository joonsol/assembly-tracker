import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
    const API_KEY = process.env.ASSEMBLY_API_KEY
    const region = req.nextUrl.searchParams.get('region') ?? ''

    const url = `https://open.assembly.go.kr/portal/openapi/nwvrqwxyaytdsfvhu?KEY=${API_KEY}&Type=json&pIndex=1&pSize=300&ORIG_NM=${encodeURIComponent(region)}`

    const res = await fetch(url)
    const text = await res.text()

    if (!text || text.trim() === '') {
        return NextResponse.json({ nwvrqwxyaytdsfvhu: [{}, { row: [] }] })
    }

    const data = JSON.parse(text)
    return NextResponse.json(data)
}