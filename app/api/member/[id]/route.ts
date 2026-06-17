import { NextRequest, NextResponse } from 'next/server'

export const revalidate = 3600

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const API_KEY = process.env.ASSEMBLY_API_KEY

  const url = `https://open.assembly.go.kr/portal/openapi/nwvrqwxyaytdsfvhu?KEY=${API_KEY}&Type=json&pIndex=1&pSize=1&MONA_CD=${id}`

  const res = await fetch(url, { next: { revalidate: 3600 } })
  const data = await res.json()
  const member = data.nwvrqwxyaytdsfvhu?.[1]?.row?.[0] ?? null

  return NextResponse.json(member, {
    headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400' }
  })
}
