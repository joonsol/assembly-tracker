'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { REGIONS } from '@/lib/regions'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { MapHandle } from '@/app/components/NaverMap'

const NaverMap = dynamic(() => import('@/app/components/NaverMap'), { ssr: false })

interface Member {
  mona_cd: string
  hg_nm: string
  poly_nm: string
  orig_nm: string
}

const PARTY_COLORS: Record<string, string> = {
  '더불어민주당': 'bg-blue-100 text-blue-700',
  '국민의힘': 'bg-red-100 text-red-700',
  '조국혁신당': 'bg-purple-100 text-purple-700',
  '개혁신당': 'bg-orange-100 text-orange-700',
  '진보당': 'bg-rose-100 text-rose-700',
  '기본소득당': 'bg-teal-100 text-teal-700',
  '사회민주당': 'bg-pink-100 text-pink-700',
}

function partyBadge(polyNm: string) {
  return PARTY_COLORS[polyNm] ?? 'bg-gray-100 text-gray-600'
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [selectedRegion, setSelectedRegion] = useState<string>('')
  const [nameQuery, setNameQuery] = useState('')
  const [listMembers, setListMembers] = useState<Member[]>([])
  const [listTitle, setListTitle] = useState('')
  const [panelOpen, setPanelOpen] = useState(false)
  const mapRef = useRef<MapHandle>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const handleRegion = (region: string) => {
    setSelectedRegion(region)
    setPanelOpen(false)
    sessionStorage.setItem('mapState', JSON.stringify({ type: 'sido', value: region }))
    mapRef.current?.loadSido(region)
  }

  const showList = (members: Member[], title: string) => {
    setListMembers(members)
    setListTitle(title)
    setPanelOpen(true)
  }

  const handleNameSearch = async () => {
    if (!nameQuery.trim()) return
    const res = await fetch(`/api/members?name=${encodeURIComponent(nameQuery)}`)
    const data = await res.json()
    const members = Array.isArray(data) ? data : []
    sessionStorage.setItem('mapState', JSON.stringify({ type: 'members', members }))
    mapRef.current?.loadMembers(members)
    if (members.length > 0) {
      showList(members, `"${nameQuery}" 검색 결과 ${members.length}명`)
    }
  }

  const handleProportional = async () => {
    setSelectedRegion('비례대표')
    const res = await fetch(`/api/members?region=${encodeURIComponent('비례대표')}`)
    const data = await res.json()
    const members = Array.isArray(data) ? data : []
    showList(members, `비례대표 의원 ${members.length}명`)
  }

  // 뒤로가기 복원
  useEffect(() => {
    const saved = sessionStorage.getItem('mapState')
    if (!saved) return
    try {
      const state = JSON.parse(saved)
      if (state.type === 'sido') {
        setSelectedRegion(state.value)
        setTimeout(() => mapRef.current?.loadSido(state.value), 300)
      } else if (state.type === 'members') {
        setTimeout(() => mapRef.current?.loadMembers(state.members), 300)
      }
    } catch {}
  }, [])

  return (
    <main className="h-screen flex flex-col overflow-hidden bg-gray-50">
      {/* 헤더 */}
      <div className="bg-blue-600 text-white px-4 py-4">
        <div className="flex items-center justify-between">
          <img src="/logo.svg" alt="한눈에 국회의원" className="h-9" />
          {user ? (
            <Link href="/mypage" className="flex items-center gap-2">
              {user.user_metadata?.avatar_url || user.user_metadata?.picture ? (
                <img
                  src={user.user_metadata.avatar_url ?? user.user_metadata.picture}
                  alt="프로필"
                  className="w-8 h-8 rounded-full border-2 border-white/40 object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-400 border-2 border-white/40 flex items-center justify-center text-sm font-bold">
                  {(user.user_metadata?.full_name ?? user.email ?? '?').charAt(0)}
                </div>
              )}
              <span className="text-xs text-blue-100">마이페이지</span>
            </Link>
          ) : (
            <Link href="/login" className="text-xs text-blue-200 border border-blue-400 px-3 py-1.5 rounded-lg">로그인</Link>
          )}
        </div>
      </div>

      {/* 컨트롤 영역 */}
      <div className="bg-white border-b border-gray-100 px-3 py-2 space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="의원 이름 검색"
            value={nameQuery}
            onChange={(e) => setNameQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleNameSearch()}
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50"
          />
          <button onClick={handleNameSearch} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">검색</button>
        </div>

        <div className="flex flex-wrap gap-1">
          {Object.keys(REGIONS).map((region) => (
            <button
              key={region}
              onClick={() => handleRegion(region)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors
                ${selectedRegion === region ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {region}
            </button>
          ))}
          <button
            onClick={handleProportional}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors
              ${selectedRegion === '비례대표' ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-600 hover:bg-purple-100'}`}
          >
            비례대표
          </button>
          <button
            onClick={() => mapRef.current?.locateMe()}
            className="px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-600"
          >
            📍 내 위치
          </button>
        </div>
      </div>

      {/* 지도 + 패널 */}
      <div className="flex-1 relative overflow-hidden flex flex-col">
        <NaverMap ref={mapRef} />

        {/* 하단 슬라이드 패널 */}
        <div
          className={`absolute inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-2xl transition-transform duration-300 ${
            panelOpen ? 'translate-y-0' : 'translate-y-full'
          }`}
          style={{ maxHeight: '60%', zIndex: 1000 }}
        >
          {/* 패널 헤더 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div>
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-800">{listTitle}</p>
            </div>
            <button onClick={() => setPanelOpen(false)} className="text-gray-400 text-xl leading-none p-1">×</button>
          </div>

          {/* 의원 목록 */}
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(60vh - 70px)' }}>
            {listMembers.map((m) => {
              const isPR = m.orig_nm === '비례대표'
              return (
                <Link
                  key={m.mona_cd}
                  href={`/member/${m.mona_cd}`}
                  className="flex items-center justify-between px-4 py-3 border-b border-gray-50 hover:bg-gray-50 active:bg-gray-100"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{m.hg_nm}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {isPR ? '비례대표 (지도 미표시)' : m.orig_nm}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${partyBadge(m.poly_nm)}`}>
                    {m.poly_nm}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </main>
  )
}
