'use client'

import { useState } from 'react'
import { REGIONS } from '@/lib/regions'
import Link from 'next/link'
export default function Home() {
  const [selectedRegion, setSelectedRegion] = useState<string>('')
  const [selectedDistrict, setSelectedDistrict] = useState<string>('')
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

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
    const row = data.nwvrqwxyaytdsfvhu?.[1]?.row ?? []
    setMembers(row)

    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-blue-600 text-white px-4 py-5">
        <h1 className="text-xl font-bold">내 지역구 국회의원</h1>
        <p className="text-blue-200 text-sm mt-1">지역을 선택하세요</p>
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
            <Link href={`/member/${m.MONA_CD}`} key={m.MONA_CD}>
              <div className="bg-white p-4 rounded-xl border border-gray-100 active:bg-gray-50">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-bold text-gray-900">{m.HG_NM}</span>
                    <span className="ml-2 text-xs text-gray-400">{m.POLY_NM}</span>
                  </div>
                  <span className="text-xs text-gray-400">{m.ORIG_NM} →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}