'use client'

import { useState, useEffect } from 'react'
import { REGIONS } from '@/lib/regions'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [selectedRegion, setSelectedRegion] = useState<string>('')
  const [selectedDistrict, setSelectedDistrict] = useState<string>('')
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [nameQuery, setNameQuery] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const handleRegion = (region: string) => {
    setSelectedRegion(region)
    setSelectedDistrict('')
    setMembers([])
  }

  const handleDistrict = async (district: string) => {
    setSelectedDistrict(district)
    setLoading(true)

    const query = `${selectedRegion} ${district}`
    const res = await fetch(`/api/members?region=${encodeURIComponent(query)}`)
    const data = await res.json()
    setMembers(Array.isArray(data) ? data : [])

    setLoading(false)
  }
  const handleNameSearch = async () => {
    if (!nameQuery.trim()) return
    setLoading(true)
    const res = await fetch(`/api/members?name=${encodeURIComponent(nameQuery)}`)
    const data = await res.json()
    setMembers(Array.isArray(data) ? data : [])
    setLoading(false)
  }
  return (
    <main className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-blue-600 text-white px-4 py-5">
        <div className="flex items-center justify-between">
          <img src="/logo.svg" alt="한눈에 국회의원" className="h-10 mb-1" />
          {user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/bookmarks"
                className="text-xs text-blue-200 border border-blue-400 px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
              >
                ★ 즐겨찾기
              </Link>
              <button
                onClick={handleLogout}
                className="text-xs text-blue-200 border border-blue-400 px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
              >
                로그아웃
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="text-xs text-blue-200 border border-blue-400 px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
            >
              로그인
            </Link>
          )}
        </div>
        <p className="text-blue-200 text-sm mt-1">우리 지역 국회의원을 빠르게 찾아보세요</p>
      </div>
      <div className="flex gap-2 mb-4 px-4 py-4">
        <input
          type="text"
          placeholder="의원 이름 검색"
          value={nameQuery}
          onChange={(e) => setNameQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleNameSearch()}
          className="flex-1 p-3 border border-gray-200 rounded-lg text-sm bg-white"
        />
        <button
          onClick={handleNameSearch}
          className="px-4 py-3 bg-blue-600 text-white rounded-lg text-sm font-medium"
        >
          검색
        </button>
      </div>
      <div className="px-4 py-4">
        {/* 시/도 선택 */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {Object.keys(REGIONS).map((region) => (
            <button
              key={region}
              onClick={() => handleRegion(region)}
              className={`py-2 rounded-lg text-sm font-medium text-center
                ${selectedRegion === region
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-200'
                }`}
            >
              {region}
            </button>
          ))}
        </div>

        {/* 구/군 선택 */}
        {selectedRegion && (
          <div className="mb-4">
            <select
              value={selectedDistrict}
              onChange={(e) => handleDistrict(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg text-gray-700 bg-white text-sm"
            >
              <option value="">구/군 선택</option>
              {REGIONS[selectedRegion].map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        )}

        {loading && (
          <div className="text-center py-8 text-gray-400 text-sm">불러오는 중...</div>
        )}

        {/* 의원 목록 */}
        <div className="space-y-2">
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
      </div>
    </main>
  )
}