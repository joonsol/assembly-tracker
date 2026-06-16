import Link from 'next/link'

interface Props {
    params: Promise<{ id: string }>
}

interface NewsItem {
    title: string
    link: string
    pubDate: string
    description: string
}

interface BlogItem {
    title: string
    link: string
    description: string
    bloggername: string
    postdate: string
}

async function getMember(id: string) {
    const API_KEY = process.env.ASSEMBLY_API_KEY
    const url = `https://open.assembly.go.kr/portal/openapi/nwvrqwxyaytdsfvhu?KEY=${API_KEY}&Type=json&pIndex=1&pSize=1&MONA_CD=${id}`
    const res = await fetch(url, { cache: 'no-store' })
    const data = await res.json()
    return data.nwvrqwxyaytdsfvhu?.[1]?.row?.[0] ?? null
}
async function getNews(name: string): Promise<NewsItem[]> {
    const CLIENT_ID = process.env.CLIENT_ID
    const CLIENT_SECRET = process.env.CLIENT_SECRET
    const url = `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(name + ' 의원')}&display=5&sort=date`
    const res = await fetch(url, {
        headers: {
            'X-Naver-Client-Id': CLIENT_ID!,
            'X-Naver-Client-Secret': CLIENT_SECRET!,
        },
        cache: 'no-store',
    })
    const data = await res.json()
    const items = data.items ?? []
    const filtered = items.filter((item: NewsItem) =>
        stripHtml(item.title).includes(name) ||
        stripHtml(item.description).includes(name)
    ).slice(0, 5)
    return filtered
}
async function getBlog(name: string, homepage: string): Promise<BlogItem[]> {
    const CLIENT_ID = process.env.CLIENT_ID
    const CLIENT_SECRET = process.env.CLIENT_SECRET

    const isNaverBlog = homepage?.includes('blog.naver.com')
    const bloggerName = isNaverBlog ? homepage.split('blog.naver.com/')[1]?.split('/')[0] : null
    const query = bloggerName
        ? `${name} 의원`
        : `${name} 국회의원`

    const url = `https://openapi.naver.com/v1/search/blog.json?query=${encodeURIComponent(query)}&display=20&sort=date`
    const res = await fetch(url, {
        headers: {
            'X-Naver-Client-Id': CLIENT_ID!,
            'X-Naver-Client-Secret': CLIENT_SECRET!,
        },
        cache: 'no-store',
    })
    const data = await res.json()
    const items: BlogItem[] = data.items ?? []

    return items.filter(item =>
        (bloggerName && item.link.includes(bloggerName)) ||
        stripHtml(item.title).includes(name) ||
        stripHtml(item.description).includes(name)
    ).slice(0, 5)
}

async function getImage(name: string): Promise<string | null> {
    const CLIENT_ID = process.env.CLIENT_ID
    const CLIENT_SECRET = process.env.CLIENT_SECRET
    const url = `https://openapi.naver.com/v1/search/image?query=${encodeURIComponent(name + ' 국회의원')}&display=1`
    const res = await fetch(url, {
        headers: {
            'X-Naver-Client-Id': CLIENT_ID!,
            'X-Naver-Client-Secret': CLIENT_SECRET!,
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
    console.log(JSON.stringify(member, null, 2))  // 여기
    const imageUrl = await getImage(member.HG_NM)
    if (!member) return <p>의원 정보를 찾을 수 없습니다.</p>

    const [newsItems, blogItems] = await Promise.all([
        getNews(member.HG_NM),
        getBlog(member.HG_NM, member.HOMEPAGE ?? ''),
    ])

    return (
        <main className="min-h-screen bg-gray-50">
            {/* 헤더 */}
            <div className="bg-blue-600 text-white px-4 py-5">
                <Link href="/" className="text-blue-200 text-sm mb-3 inline-block">
                    ← 목록으로
                </Link>
                <div className="flex items-center  gap-4">
                    <img
                        src={imageUrl?? ''}
                        alt={member.HG_NM}
                        className="w-24 h-30 object-cover rounded-lg"
                    />
                    <div>
                        <h1 className="text-2xl font-bold">{member.HG_NM}</h1>
                        <p className="text-blue-200 text-sm mt-1">{member.POLY_NM} · {member.ORIG_NM}</p>
                    </div>
                </div>
            </div>

            {/* 정보 카드 */}
            <div className="px-4 py-4 space-y-4">
                <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
                    <div className="flex justify-between px-4 py-3">
                        <span className="text-sm text-gray-400">생년월일</span>
                        <span className="text-sm font-medium">{member.BTH_DATE}</span>
                    </div>
                    <div className="flex justify-between px-4 py-3">
                        <span className="text-sm text-gray-400">당선횟수</span>
                        <span className="text-sm font-medium">{member.REELE_GBN_NM}</span>
                    </div>
                    <div className="flex justify-between px-4 py-3">
                        <span className="text-sm text-gray-400">이메일</span>
                        <span className="text-sm font-medium">{member.E_MAIL}</span>
                    </div>
                    <div className="flex justify-between px-4 py-3">
                        <span className="text-sm text-gray-400">전화번호</span>
                        <span className="text-sm font-medium">{member.TEL_NO}</span>
                    </div>
                    {member.HOMEPAGE && (
                        <div className="flex justify-between px-4 py-3">
                            <span className="text-sm text-gray-400">홈페이지</span>
                            <a href={member.HOMEPAGE} target="_blank" className="text-sm text-blue-500 font-medium">
                                바로가기 →
                            </a>
                        </div>
                    )}
                </div>

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
                {/* 블로그 */}
                <div>
                    <h2 className="text-sm font-semibold text-gray-500 mb-2 px-1">블로그</h2>
                    <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
                        {blogItems.length === 0 ? (
                            <p className="px-4 py-4 text-sm text-gray-400">블로그 글이 없습니다.</p>
                        ) : (
                            blogItems.map((item, i) => (
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
                                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                        {stripHtml(item.description)}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {item.bloggername} · {item.postdate.replace(/(\d{4})(\d{2})(\d{2})/, '$1.$2.$3')}
                                    </p>
                                </a>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </main>
    )
}
