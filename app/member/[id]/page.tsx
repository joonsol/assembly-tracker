import Link from 'next/link'
interface Props {
    params: Promise<{ id: string }>
}

async function getMember(id: string) {
    const API_KEY = process.env.ASSEMBLY_API_KEY
    const url = `https://open.assembly.go.kr/portal/openapi/nwvrqwxyaytdsfvhu?KEY=${API_KEY}&Type=json&pIndex=1&pSize=1&MONA_CD=${id}`

    const res = await fetch(url, { cache: 'no-store' })
    const data = await res.json()
    return data.nwvrqwxyaytdsfvhu?.[1]?.row?.[0] ?? null
}

export default async function MemberPage({ params }: Props) {
    const { id } = await params
    const m = await getMember(id)

    if (!m) return <p>의원 정보를 찾을 수 없습니다.</p>

    return (
        <main className="min-h-screen bg-gray-50">
            {/* 헤더 */}
            <div className="bg-blue-600 text-white px-4 py-5">
                <Link href="/" className="text-blue-200 text-sm mb-3 inline-block">
                    ← 목록으로
                </Link>
                <h1 className="text-2xl font-bold">{m.HG_NM}</h1>
                <p className="text-blue-200 text-sm mt-1">{m.POLY_NM} · {m.ORIG_NM}</p>
            </div>

            {/* 정보 카드 */}
            <div className="px-4 py-4 space-y-3">
                <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
                    <div className="flex justify-between px-4 py-3">
                        <span className="text-sm text-gray-400">생년월일</span>
                        <span className="text-sm font-medium">{m.BTH_DATE}</span>
                    </div>
                    <div className="flex justify-between px-4 py-3">
                        <span className="text-sm text-gray-400">당선횟수</span>
                        <span className="text-sm font-medium">{m.REELE_GBN_NM}</span>
                    </div>
                    <div className="flex justify-between px-4 py-3">
                        <span className="text-sm text-gray-400">이메일</span>
                        <span className="text-sm font-medium">{m.E_MAIL}</span>
                    </div>
                    {m.HOMEPAGE && (
                        <div className="flex justify-between px-4 py-3">
                            <span className="text-sm text-gray-400">홈페이지</span>
                            <a href={m.HOMEPAGE} target="_blank" className="text-sm text-blue-500 font-medium">
                                바로가기 →
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </main>
    )
}