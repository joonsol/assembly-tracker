'use client'

import { useEffect, useState } from 'react'

export default function RatingBadge({ monacd }: { monacd: string }) {
  const [avg, setAvg] = useState<number | null>(null)
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/reviews?mona_cd=${monacd}`)
      .then(r => r.json())
      .then(d => { setAvg(d.avg); setCount(d.count); setLoading(false) })
  }, [monacd])

  if (loading) return null

  return (
    <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        {/* 별점 바 */}
        <div className="flex">
          {[1,2,3,4,5].map(star => (
            <span key={star} className="relative text-xl inline-block w-5">
              <span className="text-gray-200">★</span>
              <span
                className="absolute inset-0 overflow-hidden text-yellow-400"
                style={{ width: (avg ?? 0) >= star ? '100%' : (avg ?? 0) >= star - 0.5 ? '50%' : '0%' }}
              >★</span>
            </span>
          ))}
        </div>
        {count > 0
          ? <span className="text-base font-bold text-gray-800">{avg?.toFixed(1)}</span>
          : <span className="text-sm text-gray-400">아직 평가 없음</span>
        }
      </div>
      <span className="text-xs text-gray-400">{count > 0 ? `${count}명 평가` : '첫 평가를 남겨보세요'}</span>
    </div>
  )
}
