'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function BookmarksPage() {
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/login'; return }

      const bookmarkRes = await fetch('/api/bookmarks', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const bookmarks: { mona_cd: string }[] = await bookmarkRes.json()

      if (bookmarks.length === 0) { setLoading(false); return }

      const ids = bookmarks.map(b => b.mona_cd)
      const { data } = await supabase
        .from('member_stats')
        .select('mona_cd, hg_nm, poly_nm, orig_nm')
        .in('mona_cd', ids)

      const ordered = ids.map(id => data?.find(m => m.mona_cd === id)).filter(Boolean)
      setMembers(ordered)
      setLoading(false)
    })
  }, [])

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-blue-600 text-white px-4 py-5">
        <Link href="/" className="text-blue-200 text-sm mb-3 inline-block">← 홈으로</Link>
        <h1 className="text-xl font-bold">즐겨찾기</h1>
      </div>

      <div className="px-4 py-4 space-y-2">
        {loading && <p className="text-center py-8 text-gray-400 text-sm">불러오는 중...</p>}
        {!loading && members.length === 0 && (
          <p className="text-center py-8 text-gray-400 text-sm">즐겨찾기한 의원이 없습니다.</p>
        )}
        {members.map((m: any) => (
          <Link href={`/member/${m.mona_cd}`} key={m.mona_cd}>
            <div className="bg-white p-4 rounded-xl border border-gray-100 active:bg-gray-50">
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-bold text-gray-900">{m.hg_nm}</span>
                  <span className="ml-2 text-xs text-gray-400">{m.poly_nm}</span>
                </div>
                <span className="text-xs text-gray-400">{m.orig_nm} →</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  )
}
