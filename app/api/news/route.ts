import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
    const query = req.nextUrl.searchParams.get('q')
    if (!query) return NextResponse.json({ items: [] })

    const CLIENT_ID = process.env.CLIENT_ID
    const CLIENT_SECRET = process.env.CLIENT_SECRET

    const url = `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(query)}&display=5&sort=date`

    const res = await fetch(url, {
        headers: {
            'X-Naver-Client-Id': CLIENT_ID!,
            'X-Naver-Client-Secret': CLIENT_SECRET!,
        },
        cache: 'no-store',
    })

    const data = await res.json()
    return NextResponse.json(data)
}
