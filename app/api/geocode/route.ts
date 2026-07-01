import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
    const lat = req.nextUrl.searchParams.get('lat')
    const lng = req.nextUrl.searchParams.get('lng')

    if (!lat || !lng) {
        return NextResponse.json({ error: 'lat, lng required' }, { status: 400 })
    }

    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ko`
    const res = await fetch(url, {
        headers: { 'User-Agent': 'assembly-tracker/1.0' },
    })

    if (!res.ok) {
        return NextResponse.json({ error: 'Geocode API error' }, { status: 500 })
    }

    const data = await res.json()
    const addr = data.address

    if (!addr) {
        return NextResponse.json({ error: 'No result' }, { status: 404 })
    }

    // Nominatim 한국 주소: state = 시/도, city|county = 시군구
    const sido = addr.state ?? ''
    const sigungu = addr.city ?? addr.county ?? addr.town ?? addr.village ?? ''

    return NextResponse.json({ sido, sigungu })
}
