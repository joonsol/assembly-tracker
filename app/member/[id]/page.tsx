import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface Props {
    params: Promise<{ id: string }>
}

interface NewsItem {
    title: string
    link: string
    pubDate: string
    description: string
}

async function getMember(id: string) {
    const { data, error } = await supabase
        .from('member_stats')
        .select('*')
        .eq('mona_cd', id)
        .single()
    if (error) return null
    return data
}

async function getMemberDetail(id: string) {
    const API_KEY = process.env.ASSEMBLY_API_KEY
    const url = `https://open.assembly.go.kr/portal/openapi/nwvrqwxyaytdsfvhu?KEY=${API_KEY}&Type=json&pIndex=1&pSize=1&MONA_CD=${id}`
    try {
        const res = await fetch(url, { cache: 'no-store' })
        const data = await res.json()
        return data.nwvrqwxyaytdsfvhu?.[1]?.row?.[0] ?? null
    } catch {
        return null
    }
}

async function getBills(id: string) {
    const { data } = await supabase
        .from('member_bills')
        .select('*')
        .eq('mona_cd', id)
        .order('propose_dt', { ascending: false })
        .limit(10)
    return data ?? []
}

async function getNews(name: string): Promise<NewsItem[]> {
    const CLIENT_ID = process.env.CLIENT_ID
    const CLIENT_SECRET = process.env.CLIENT_SECRET
    if (!CLIENT_ID || !CLIENT_SECRET) return []
    const url = `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(name + ' 의원')}&display=5&sort=date`
    const res = await fetch(url, {
        headers: {
            'X-Naver-Client-Id': CLIENT_ID,
            'X-Naver-Client-Secret': CLIENT_SECRET,
        },
        cache: 'no-store',
    })
    const data = await res.json()
    return (data.items ?? []).filter((item: NewsItem) =>
        stripHtml(item.title).includes(name) ||
        stripHtml(item.description).includes(name)
    ).slice(0, 5)
}

async function getImage(name: string): Promise<string | null> {
    const CLIENT_ID = process.env.CLIENT_ID
    const CLIENT_SECRET = process.env.CLIENT_SECRET
    if (!CLIENT_ID || !CLIENT_SECRET) return null
    const url = `https://openapi.naver.com/v1/search/image?query=${encodeURIComponent(name + ' 국회의원')}&display=1`
    const res = await fetch(url, {
        headers: {
            'X-Naver-Client-Id': CLIENT_ID,
            'X-Naver-Client-Secret': CLIENT_SECRET,
        },
        cache: 'no-store',
    })
    const data = await res.json()
    return data.items?.[0]?.link ?? null
}

function stripHtml(html: string) {
    return html.replace(/<[^>]*>/g, '')
}

function formatDate(pubDate: string) {
    const d = new Date(pubDate)
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

export default async function MemberPage({ params }: Props) {
    const { id } = await params
    const member = await getMember(id)
    if (!member) return <p>의원 정보를 찾을 수 없습니다.</p>

    const [newsItems, bills, imageUrl, detail] = await Promise.all([
        getNews(member.hg_nm),
        getBills(id),
        getImage(member.hg_nm),
        getMemberDetail(id),
    ])

    const totalVotes = (member.vote_yes ?? 0) + (member.vote_no ?? 0) + (member.vote_abstain ?? 0) + (member.vote_absent ?? 0)

    return (
        <main className="min-h-screen bg-gray-50">
            {/* 헤더 */}
            <div className="bg-blue-600 text-white px-4 py-5">
                <Link href="/" className="text-blue-200 text-sm mb-3 inline-block">
                    ← 목록으로
                </Link>
                <div className="flex items-center gap-4">
                    {imageUrl && (
                        <img
                            src={imageUrl}
                            alt={member.hg_nm}
                            className="w-20 h-24 object-cover rounded-lg"
                        />
                    )}
                    <div>
                        <h1 className="text-2xl font-bold">{member.hg_nm}</h1>
                        <p className="text-blue-200 text-sm mt-1">{member.poly_nm} · {member.orig_nm}</p>
                    </div>
                </div>
            </div>

            <div className="px-4 py-4 space-y-4">
                {/* 프로필 */}
                {detail && (
                    <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
                        {detail.BTH_DATE && (
                            <div className="flex justify-between px-4 py-3">
                                <span className="text-sm text-gray-400">생년월일</span>
                                <span className="text-sm font-medium">{detail.BTH_DATE}</span>
                            </div>
                        )}
                        {detail.REELE_GBN_NM && (
                            <div className="flex justify-between px-4 py-3">
                                <span className="text-sm text-gray-400">당선횟수</span>
                                <span className="text-sm font-medium">{detail.REELE_GBN_NM}</span>
                            </div>
                        )}
                        {detail.E_MAIL && (
                            <div className="flex justify-between px-4 py-3">
                                <span className="text-sm text-gray-400">이메일</span>
                                <span className="text-sm font-medium">{detail.E_MAIL}</span>
                            </div>
                        )}
                        {detail.TEL_NO && (
                            <div className="flex justify-between px-4 py-3">
                                <span className="text-sm text-gray-400">전화번호</span>
                                <span className="text-sm font-medium">{detail.TEL_NO}</span>
                            </div>
                        )}
                        <div className="flex justify-between px-4 py-3">
                            <span className="text-sm text-gray-400">홈페이지</span>
                            {detail.HOMEPAGE ? (
                                <a href={detail.HOMEPAGE} target="_blank" className="text-sm text-blue-500 font-medium">
                                    바로가기 →
                                </a>
                            ) : (
                                <span className="text-sm text-gray-300">-</span>
                            )}
                        </div>
                    </div>
                )}

                {/* 의정활동 요약 */}
                <div>
                    <h2 className="text-sm font-semibold text-gray-500 mb-2 px-1">의정활동</h2>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
                            <p className="text-2xl font-bold text-blue-600">{member.bill_count ?? 0}</p>
                            <p className="text-xs text-gray-400 mt-1">발의 법안</p>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
                            <p className="text-2xl font-bold text-green-600">{member.bill_passed ?? 0}</p>
                            <p className="text-xs text-gray-400 mt-1">가결 법안</p>
                        </div>
                    </div>
                </div>

                {/* 투표 현황 */}
                <div>
                    <h2 className="text-sm font-semibold text-gray-500 mb-2 px-1">투표 현황 {totalVotes > 0 && <span className="font-normal text-gray-400">({totalVotes}회)</span>}</h2>
                    <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-2">
                        {[
                            { label: '찬성', value: member.vote_yes ?? 0, color: 'bg-blue-500' },
                            { label: '반대', value: member.vote_no ?? 0, color: 'bg-red-400' },
                            { label: '기권', value: member.vote_abstain ?? 0, color: 'bg-gray-300' },
                            { label: '불참', value: member.vote_absent ?? 0, color: 'bg-yellow-300' },
                        ].map(({ label, value, color }) => (
                            <div key={label}>
                                <div className="flex justify-between text-xs text-gray-500 mb-1">
                                    <span>{label}</span>
                                    <span>{value}회 {totalVotes > 0 ? `(${Math.round(value / totalVotes * 100)}%)` : ''}</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2">
                                    <div
                                        className={`${color} h-2 rounded-full`}
                                        style={{ width: totalVotes > 0 ? `${value / totalVotes * 100}%` : '0%' }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 출석 현황 */}
                <details className="bg-white rounded-xl border border-gray-100">
                    <summary className="px-4 py-3 text-sm font-semibold text-gray-700 cursor-pointer list-none flex justify-between items-center">
                        <span>출석 현황</span>
                        <span className="text-gray-400 text-xs">
                            출석률 {totalVotes > 0 ? Math.round((totalVotes - (member.vote_absent ?? 0)) / totalVotes * 100) : 0}%
                        </span>
                    </summary>
                    <div className="px-4 pb-4 pt-1 divide-y divide-gray-100">
                        {[
                            { label: '출석', value: totalVotes - (member.vote_absent ?? 0) },
                            { label: '불참', value: member.vote_absent ?? 0 },
                        ].map(({ label, value }) => (
                            <div key={label} className="py-2">
                                <div className="flex justify-between text-xs text-gray-500 mb-1">
                                    <span>{label}</span>
                                    <span>{value}회 {totalVotes > 0 ? `(${Math.round(value / totalVotes * 100)}%)` : ''}</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full ${label === '출석' ? 'bg-blue-500' : 'bg-gray-300'}`}
                                        style={{ width: totalVotes > 0 ? `${value / totalVotes * 100}%` : '0%' }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </details>

                {/* 발의 법안 목록 */}
                <details className="bg-white rounded-xl border border-gray-100">
                    <summary className="px-4 py-3 text-sm font-semibold text-gray-700 cursor-pointer list-none flex justify-between items-center">
                        <span>최근 발의 법안</span>
                        <span className="text-gray-400 text-xs">{bills.length}건 ▾</span>
                    </summary>
                    <div className="divide-y divide-gray-100">
                        {bills.length === 0 ? (
                            <p className="px-4 py-4 text-sm text-gray-400">발의 법안이 없습니다.</p>
                        ) : (
                            bills.map((bill: any) => (
                                <a
                                    key={bill.bill_id}
                                    href={bill.detail_link ?? '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block px-4 py-3 hover:bg-gray-50"
                                >
                                    <p className="text-sm font-medium text-gray-800 line-clamp-2">{bill.bill_name}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs text-gray-400">{bill.propose_dt}</span>
                                        {bill.proc_result && (
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                                                ${bill.proc_result === '원안가결' || bill.proc_result === '수정가결'
                                                    ? 'bg-green-100 text-green-700'
                                                    : bill.proc_result === '폐기' || bill.proc_result === '부결'
                                                    ? 'bg-red-100 text-red-600'
                                                    : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                {bill.proc_result}
                                            </span>
                                        )}
                                    </div>
                                </a>
                            ))
                        )}
                    </div>
                </details>

                {/* 최근 뉴스 */}
                <div>
                    <h2 className="text-sm font-semibold text-gray-500 mb-2 px-1">최근 뉴스</h2>
                    <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
                        {newsItems.length === 0 ? (
                            <p className="px-4 py-4 text-sm text-gray-400">뉴스가 없습니다.</p>
                        ) : (
                            newsItems.map((item, i) => (
                                <a
                                    key={i}
                                    href={item.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block px-4 py-3 hover:bg-gray-50"
                                >
                                    <p className="text-sm font-medium text-gray-800 line-clamp-2">
                                        {stripHtml(item.title)}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">{formatDate(item.pubDate)}</p>
                                </a>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </main>
    )
}
