'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface Member {
    mona_cd: string
    hg_nm: string
    poly_nm: string
    orig_nm: string
    bill_count: number
    bill_passed: number
    vote_yes: number
    vote_no: number
    vote_abstain: number
    vote_absent: number
}

function StatRow({ label, a, b, higherBetter = true }: { label: string; a: number; b: number; higherBetter?: boolean }) {
    const total = a + b
    const aWidth = total === 0 ? 50 : Math.round((a / total) * 100)
    const bWidth = 100 - aWidth
    const aWins = higherBetter ? a >= b : a <= b
    const bWins = higherBetter ? b > a : b < a

    return (
        <div className="py-3 px-4">
            <p className="text-xs text-gray-400 text-center mb-2">{label}</p>
            <div className="flex items-center gap-3">
                <span className={`text-sm font-bold w-12 text-right ${aWins ? 'text-blue-600' : 'text-gray-500'}`}>{a}</span>
                <div className="flex-1 flex h-2 rounded-full overflow-hidden bg-gray-100">
                    <div className="bg-blue-500 h-full transition-all" style={{ width: `${aWidth}%` }} />
                    <div className="bg-red-400 h-full transition-all" style={{ width: `${bWidth}%` }} />
                </div>
                <span className={`text-sm font-bold w-12 ${bWins ? 'text-red-500' : 'text-gray-500'}`}>{b}</span>
            </div>
        </div>
    )
}

function MemberSearch({ label, selected, onSelect }: {
    label: string
    selected: Member | null
    onSelect: (m: Member) => void
}) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<Member[]>([])
    const [loading, setLoading] = useState(false)

    const search = async (q: string) => {
        if (!q.trim()) { setResults([]); return }
        setLoading(true)
        const res = await fetch(`/api/members?name=${encodeURIComponent(q)}`)
        const data = await res.json()
        setResults(Array.isArray(data) ? data.slice(0, 6) : [])
        setLoading(false)
    }

    return (
        <div className="flex-1">
            <p className="text-xs text-gray-400 mb-1 px-1">{label}</p>
            {selected ? (
                <div className="bg-white border border-blue-200 rounded-xl p-3 relative">
                    <p className="font-bold text-gray-800">{selected.hg_nm}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{selected.poly_nm} · {selected.orig_nm}</p>
                    <button
                        onClick={() => { onSelect(null as any); setQuery('') }}
                        className="absolute top-2 right-2 text-gray-300 text-lg leading-none"
                    >×</button>
                </div>
            ) : (
                <div className="relative">
                    <input
                        value={query}
                        onChange={(e) => { setQuery(e.target.value); search(e.target.value) }}
                        placeholder="이름 검색"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50"
                    />
                    {loading && <p className="absolute right-3 top-2.5 text-xs text-gray-400">검색중...</p>}
                    {(results.length > 0 || (query.length >= 1 && !loading)) && (
                        <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                            {results.length === 0 ? (
                                <p className="px-3 py-3 text-sm text-gray-400">결과 없음</p>
                            ) : results.map((m) => (
                                <button
                                    key={m.mona_cd}
                                    onMouseDown={(e) => { e.preventDefault(); onSelect(m); setResults([]); setQuery('') }}
                                    className="w-full text-left px-3 py-2.5 hover:bg-blue-50 border-b border-gray-50 last:border-0"
                                >
                                    <p className="text-sm font-medium text-gray-800">{m.hg_nm}</p>
                                    <p className="text-xs text-gray-400">{m.poly_nm} · {m.orig_nm}</p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

function CompareContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const aId = searchParams.get('a')

    const [memberA, setMemberA] = useState<Member | null>(null)
    const [memberB, setMemberB] = useState<Member | null>(null)

    useEffect(() => {
        if (aId) {
            fetch(`/api/members?id=${aId}`)
                .then(r => r.json())
                .then(data => {
                    const m = Array.isArray(data) ? data[0] : data
                    if (m) setMemberA(m)
                })
        }
    }, [aId])

    const totalA = (memberA?.vote_yes ?? 0) + (memberA?.vote_no ?? 0) + (memberA?.vote_abstain ?? 0) + (memberA?.vote_absent ?? 0)
    const totalB = (memberB?.vote_yes ?? 0) + (memberB?.vote_no ?? 0) + (memberB?.vote_abstain ?? 0) + (memberB?.vote_absent ?? 0)
    const attendA = totalA - (memberA?.vote_absent ?? 0)
    const attendB = totalB - (memberB?.vote_absent ?? 0)

    return (
        <main className="min-h-screen bg-gray-50">
            <div className="bg-blue-600 text-white px-4 py-5">
                <div className="flex items-center gap-3 mb-1">
                    <Link href="/" className="text-blue-200 text-sm">← 홈</Link>
                </div>
                <h1 className="text-xl font-bold">의원 비교</h1>
            </div>

            <div className="px-4 py-4 space-y-4">
                {/* 의원 선택 */}
                <div className="flex gap-3 overflow-visible">
                    <MemberSearch label="의원 A" selected={memberA} onSelect={setMemberA} />
                    <div className="flex items-center pt-4 text-gray-300 font-bold text-lg shrink-0">VS</div>
                    <MemberSearch label="의원 B" selected={memberB} onSelect={setMemberB} />
                </div>

                {/* 비교 결과 */}
                {memberA && memberB ? (
                    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                        {/* 헤더 */}
                        <div className="grid grid-cols-3 bg-gray-50 border-b border-gray-100">
                            <div className="p-3 text-center">
                                <Link href={`/member/${memberA.mona_cd}`} className="text-sm font-bold text-blue-600">{memberA.hg_nm}</Link>
                                <p className="text-xs text-gray-400 mt-0.5">{memberA.poly_nm}</p>
                            </div>
                            <div className="p-3 flex items-center justify-center">
                                <span className="text-xs text-gray-300 font-bold">VS</span>
                            </div>
                            <div className="p-3 text-center">
                                <Link href={`/member/${memberB.mona_cd}`} className="text-sm font-bold text-red-500">{memberB.hg_nm}</Link>
                                <p className="text-xs text-gray-400 mt-0.5">{memberB.poly_nm}</p>
                            </div>
                        </div>

                        <div className="divide-y divide-gray-50">
                            <StatRow label="발의 법안" a={memberA.bill_count ?? 0} b={memberB.bill_count ?? 0} />
                            <StatRow label="가결 법안" a={memberA.bill_passed ?? 0} b={memberB.bill_passed ?? 0} />
                            <StatRow label="찬성 투표" a={memberA.vote_yes ?? 0} b={memberB.vote_yes ?? 0} />
                            <StatRow label="반대 투표" a={memberA.vote_no ?? 0} b={memberB.vote_no ?? 0} />
                            <StatRow label="기권" a={memberA.vote_abstain ?? 0} b={memberB.vote_abstain ?? 0} higherBetter={false} />
                            <StatRow label="출석 횟수" a={attendA} b={attendB} />
                            <StatRow label="불참 횟수" a={memberA.vote_absent ?? 0} b={memberB.vote_absent ?? 0} higherBetter={false} />
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-400 text-sm">
                        두 의원을 선택하면 비교 결과가 표시됩니다
                    </div>
                )}
            </div>
        </main>
    )
}

export default function ComparePage() {
    return (
        <Suspense>
            <CompareContent />
        </Suspense>
    )
}
