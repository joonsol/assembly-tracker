import { NextRequest, NextResponse } from 'next/server'

const cache = new Map<string, { lat: number; lng: number }>()

export async function GET(req: NextRequest) {
    const place = req.nextUrl.searchParams.get('place')
    if (!place) return NextResponse.json({ error: 'place required' }, { status: 400 })

    if (cache.has(place)) {
        return NextResponse.json(cache.get(place))
    }

    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(place + ' 대한민국')}&format=json&limit=1&accept-language=ko`
    const res = await fetch(url, {
        headers: { 'User-Agent': 'assembly-tracker/1.0' },
    })

    if (!res.ok) return NextResponse.json({ error: 'API error' }, { status: 500 })

    const data = await res.json()
    if (!data[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const result = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
    cache.set(place, result)

    return NextResponse.json(result)
}
