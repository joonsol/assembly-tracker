'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '@/lib/supabase'

interface Review {
  id: string
  user_id: string
  rating: number
  comment: string
  created_at: string
}

function StarDisplay({ value }: { value: number }) {
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className="relative text-lg w-5 inline-block">
          <span className="text-gray-200">★</span>
          <span
            className="absolute inset-0 overflow-hidden text-yellow-400"
            style={{ width: value >= star ? '100%' : value >= star - 0.5 ? '50%' : '0%' }}
          >★</span>
        </span>
      ))}
    </div>
  )
}

function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState<number | null>(null)
  const display = hover ?? value

  return (
    <div className="flex" onMouseLeave={() => setHover(null)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <div key={star} className="relative w-10 h-10 text-3xl cursor-pointer select-none">
          <span className="text-gray-200">★</span>
          <span
            className="absolute inset-0 overflow-hidden text-yellow-400"
            style={{ width: display >= star ? '100%' : display >= star - 0.5 ? '50%' : '0%' }}
          >★</span>
          <span className="absolute inset-0 w-1/2" onMouseEnter={() => setHover(star - 0.5)} onClick={() => onChange(star - 0.5)} />
          <span className="absolute left-1/2 inset-y-0 right-0" onMouseEnter={() => setHover(star)} onClick={() => onChange(star)} />
        </div>
      ))}
    </div>
  )
}

export default function ReviewSection({ monacd }: { monacd: string }) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [avg, setAvg] = useState<number | null>(null)
  const [count, setCount] = useState(0)
  const [myReview, setMyReview] = useState<Review | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)

  const [sheetOpen, setSheetOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchReviews = async (tok?: string) => {
    const res = await fetch(`/api/reviews?mona_cd=${monacd}`, {
      headers: tok ? { Authorization: `Bearer ${tok}` } : {},
    })
    const data = await res.json()
    setReviews(data.reviews ?? [])
    setAvg(data.avg)
    setCount(data.count)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const tok = session?.access_token ?? null
      const uid = session?.user?.id ?? null
      setToken(tok)
      setUserId(uid)
      fetchReviews(tok ?? undefined)
    })
  }, [monacd])

  useEffect(() => {
    if (userId && reviews.length > 0) {
      const mine = reviews.find(r => r.user_id === userId) ?? null
      setMyReview(mine)
      if (mine) { setRating(mine.rating); setComment(mine.comment ?? '') }
    }
  }, [reviews, userId])

  const openSheet = () => {
    if (!token) { window.location.href = '/login'; return }
    setSheetOpen(true)
  }

  const handleSubmit = async () => {
    if (rating === 0) { alert('별점을 선택해주세요'); return }
    setSubmitting(true)
    await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ mona_cd: monacd, rating, comment }),
    })
    setSheetOpen(false)
    await fetchReviews(token ?? undefined)
    setSubmitting(false)
  }

  const handleDelete = async () => {
    if (!confirm('리뷰를 삭제할까요?')) return
    await fetch(`/api/reviews?mona_cd=${monacd}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token!}` },
    })
    setMyReview(null)
    setRating(0)
    setComment('')
    await fetchReviews(token ?? undefined)
  }

  const formatDate = (s: string) => {
    const d = new Date(s)
    return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`
  }

  return (
    <>
      {/* 리뷰 목록 */}
      <div className="space-y-2">
        {/* 평점 요약 */}
        {count > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
            <div className="text-center min-w-[48px]">
              <p className="text-3xl font-bold text-gray-800">{avg?.toFixed(1)}</p>
              <p className="text-xs text-gray-400 mt-0.5">{count}명</p>
            </div>
            <StarDisplay value={avg ?? 0} />
          </div>
        )}

        {/* 내 리뷰 */}
        {myReview && (
          <div className="bg-blue-50 rounded-xl border border-blue-100 p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-blue-600">내 평가</span>
              <div className="flex gap-3">
                <button onClick={openSheet} className="text-xs text-gray-400">수정</button>
                <button onClick={handleDelete} className="text-xs text-red-400">삭제</button>
              </div>
            </div>
            <StarDisplay value={myReview.rating} />
            {myReview.comment && <p className="text-sm text-gray-700 mt-1.5">{myReview.comment}</p>}
          </div>
        )}

        {/* 다른 사람 리뷰 */}
        {reviews.filter(r => r.user_id !== userId).length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
            {reviews.filter(r => r.user_id !== userId).map(r => (
              <div key={r.id} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <StarDisplay value={r.rating} />
                  <span className="text-xs text-gray-400">{formatDate(r.created_at)}</span>
                </div>
                {r.comment && <p className="text-sm text-gray-600 mt-1">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}

        {count === 0 && (
          <p className="text-center py-4 text-sm text-gray-400">아직 평가가 없습니다. 첫 번째로 평가해보세요!</p>
        )}
      </div>

      {/* 플로팅 평가 버튼 */}
      <button
        onClick={openSheet}
        className="fixed bottom-20 right-4 flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-full shadow-lg text-sm font-semibold z-40 active:scale-95 transition-transform"
      >
        <span className="text-yellow-300">★</span>
        {myReview ? '평가 수정' : '평가하기'}
      </button>

      {/* 바텀 시트 — body에 포털로 마운트 */}
      {sheetOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0"
          style={{ zIndex: 99999 }}
          onClick={() => setSheetOpen(false)}
        >
          {/* 어두운 배경 */}
          <div className="absolute inset-0 bg-black/60" />

          {/* 시트 본체 */}
          <div
            className="absolute inset-x-0 bottom-0 bg-white rounded-t-3xl px-5 pt-3 pb-10 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />

            <h3 className="text-lg font-bold text-gray-900 mb-5 text-center">
              {myReview ? '평가 수정' : '의원 평가하기'}
            </h3>

            {/* 별점 */}
            <div className="flex justify-center mb-1">
              <StarInput value={rating} onChange={setRating} />
            </div>
            <p className="text-center text-sm font-medium mb-5" style={{ color: rating > 0 ? '#eab308' : '#9ca3af' }}>
              {rating > 0 ? `${rating}점` : '별을 눌러 점수를 선택하세요'}
            </p>

            {/* 한줄 리뷰 */}
            <div className="relative mb-5">
              <input
                type="text"
                value={comment}
                onChange={e => setComment(e.target.value.slice(0, 50))}
                placeholder="한줄 리뷰 (선택)"
                className="w-full border border-gray-200 rounded-2xl px-4 py-3.5 text-sm bg-gray-50 focus:outline-none focus:border-blue-300 pr-12"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-300">
                {comment.length}/50
              </span>
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting || rating === 0}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl text-base font-bold disabled:opacity-30 active:scale-[0.98] transition-transform"
            >
              {submitting ? '저장 중...' : '저장하기'}
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
