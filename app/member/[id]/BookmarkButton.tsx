'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function BookmarkButton({ monacd }: { monacd: string }) {
  const [bookmarked, setBookmarked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { setLoading(false); return }
      setLoggedIn(true)
      const res = await fetch(`/api/bookmarks?mona_cd=${monacd}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const data = await res.json()
      setBookmarked(data.bookmarked)
      setLoading(false)
    })
  }, [monacd])

  const toggle = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { window.location.href = '/login'; return }

    setBookmarked(prev => !prev)
    if (bookmarked) {
      await fetch(`/api/bookmarks?mona_cd=${monacd}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
    } else {
      await fetch('/api/bookmarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ mona_cd: monacd }),
      })
    }
  }

  if (loading) return null

  return (
    <button
      onClick={toggle}
      className="text-2xl leading-none"
      title={bookmarked ? '즐겨찾기 해제' : '즐겨찾기 추가'}
    >
      {bookmarked ? '★' : '☆'}
    </button>
  )
}
