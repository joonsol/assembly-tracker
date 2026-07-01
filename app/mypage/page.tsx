'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import type { User } from '@supabase/supabase-js'

interface Member {
  mona_cd: string
  hg_nm: string
  poly_nm: string
  orig_nm: string
  bill_count: number
  bill_passed: number
}

const PARTY_COLORS: Record<string, string> = {
  '더불어민주당': 'bg-blue-100 text-blue-700 border-blue-200',
  '국민의힘': 'bg-red-100 text-red-700 border-red-200',
  '조국혁신당': 'bg-purple-100 text-purple-700 border-purple-200',
  '개혁신당': 'bg-orange-100 text-orange-700 border-orange-200',
  '진보당': 'bg-rose-100 text-rose-700 border-rose-200',
  '기본소득당': 'bg-teal-100 text-teal-700 border-teal-200',
  '사회민주당': 'bg-pink-100 text-pink-700 border-pink-200',
}

function partyBadge(polyNm: string) {
  return PARTY_COLORS[polyNm] ?? 'bg-gray-100 text-gray-600 border-gray-200'
}

function MemberCard({ member }: { member: Member }) {
  const [imgUrl, setImgUrl] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/member-image?name=${encodeURIComponent(member.hg_nm)}`)
      .then(r => r.json())
      .then(d => setImgUrl(d.url ?? null))
      .catch(() => {})
  }, [member.hg_nm])

  return (
    <Link href={`/member/${member.mona_cd}`}>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow active:scale-[0.98]">
        {/* 사진 영역 */}
        <div className="w-full h-36 bg-gradient-to-br from-blue-50 to-blue-100 relative overflow-hidden">
          {imgUrl ? (
            <img src={imgUrl} alt={member.hg_nm} className="w-full h-full object-cover object-top" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl text-blue-200">👤</div>
          )}
          <span className={`absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full font-medium border ${partyBadge(member.poly_nm)}`}>
            {member.poly_nm}
          </span>
        </div>

        {/* 정보 */}
        <div className="px-3 py-3">
          <p className="font-bold text-gray-900 text-base">{member.hg_nm}</p>
          <p className="text-xs text-gray-400 mt-0.5 truncate">{member.orig_nm}</p>
          <div className="flex gap-3 mt-2">
            <div className="text-center">
              <p className="text-sm font-bold text-blue-600">{member.bill_count ?? 0}</p>
              <p className="text-[10px] text-gray-400">발의</p>
            </div>
            <div className="w-px bg-gray-100" />
            <div className="text-center">
              <p className="text-sm font-bold text-green-600">{member.bill_passed ?? 0}</p>
              <p className="text-[10px] text-gray-400">가결</p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function MyPage() {
  const [user, setUser] = useState<User | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/login'; return }
      setUser(session.user)

      const bookmarkRes = await fetch('/api/bookmarks', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const bookmarks: { mona_cd: string }[] = await bookmarkRes.json()

      if (bookmarks.length === 0) { setLoading(false); return }

      const ids = bookmarks.map(b => b.mona_cd)
      const { data } = await supabase
        .from('member_stats')
        .select('mona_cd, hg_nm, poly_nm, orig_nm, bill_count, bill_passed')
        .in('mona_cd', ids)

      const ordered = ids
        .map(id => data?.find(m => m.mona_cd === id))
        .filter(Boolean) as Member[]
      setMembers(ordered)
      setLoading(false)
    })
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const displayName = user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? user?.email ?? '사용자'
  const avatarUrl = user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture ?? null

  return (
    <main className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-blue-600 text-white px-4 pt-5 pb-8">
        <div className="flex items-center justify-between mb-5">
          <Link href="/" className="text-blue-200 text-sm">← 홈</Link>
          <button onClick={handleLogout} className="text-xs text-blue-200 border border-blue-400 px-3 py-1.5 rounded-lg">
            로그아웃
          </button>
        </div>
        {/* 프로필 */}
        <div className="flex items-center gap-4">
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className="w-14 h-14 rounded-full border-2 border-white/40 object-cover" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-blue-400 flex items-center justify-center text-2xl font-bold">
              {displayName.charAt(0)}
            </div>
          )}
          <div>
            <p className="font-bold text-lg">{displayName}</p>
            {user?.email && <p className="text-blue-200 text-xs mt-0.5">{user.email}</p>}
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4">
        {/* 즐겨찾기 섹션 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-800">즐겨찾기 의원</h2>
            <span className="text-xs text-gray-400">{members.length}명</span>
          </div>

          {loading ? (
            <p className="text-center py-6 text-gray-400 text-sm">불러오는 중...</p>
          ) : members.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-3xl mb-2">★</p>
              <p className="text-gray-400 text-sm">즐겨찾기한 의원이 없습니다</p>
              <Link href="/" className="mt-3 inline-block text-sm text-blue-500 font-medium">
                의원 찾아보기 →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {members.map(m => <MemberCard key={m.mona_cd} member={m} />)}
            </div>
          )}
        </div>

        {/* 기능 바로가기 */}
        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 mb-6">
          <Link href="/compare" className="flex items-center justify-between px-4 py-3.5 hover:bg-gray-50">
            <span className="text-sm text-gray-700">⚖️ 의원 비교하기</span>
            <span className="text-gray-300">›</span>
          </Link>
          <Link href="/" className="flex items-center justify-between px-4 py-3.5 hover:bg-gray-50">
            <span className="text-sm text-gray-700">🗺️ 지역구 지도 보기</span>
            <span className="text-gray-300">›</span>
          </Link>
        </div>
      </div>
    </main>
  )
}
