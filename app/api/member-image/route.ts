import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
    const name = req.nextUrl.searchParams.get('name')
    if (!name) return NextResponse.json({ url: null })

    const CLIENT_ID = process.env.CLIENT_ID
    const CLIENT_SECRET = process.env.CLIENT_SECRET
    if (!CLIENT_ID || !CLIENT_SECRET) return NextResponse.json({ url: null })

    const url = `https://openapi.naver.com/v1/search/image?query=${encodeURIComponent(name + ' 국회의원')}&display=1`
    const res = await fetch(url, {
        headers: {
            'X-Naver-Client-Id': CLIENT_ID,
            'X-Naver-Client-Secret': CLIENT_SECRET,
        },
        next: { revalidate: 3600 },
    })

    const data = await res.json()
    const imageUrl = data.items?.[0]?.link ?? null
    return NextResponse.json({ url: imageUrl })
}
