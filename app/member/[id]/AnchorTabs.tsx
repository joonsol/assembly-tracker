'use client'

import { useEffect, useRef, useState } from 'react'

const TABS = [
  { id: 'section-info', label: '기본정보' },
  { id: 'section-activity', label: '의정활동' },
  { id: 'section-district', label: '지역구' },
  { id: 'section-review', label: '시민평가' },
]

export default function AnchorTabs() {
  const [active, setActive] = useState('section-info')
  const barRef = useRef<HTMLDivElement>(null)

  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (!el) return
    const stickyH = barRef.current?.closest('[class*="sticky"]')?.getBoundingClientRect().height
      ?? (barRef.current?.parentElement?.getBoundingClientRect().height ?? 120)
    const top = el.getBoundingClientRect().top + window.scrollY - stickyH - 8
    window.scrollTo({ top, behavior: 'smooth' })
    setActive(id)
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) setActive(e.target.id)
        })
      },
      { rootMargin: '-40% 0px -55% 0px' }
    )
    TABS.forEach(t => {
      const el = document.getElementById(t.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={barRef} className="bg-white border-b border-gray-100 flex">
      {TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => scrollTo(tab.id)}
          className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
            active === tab.id ? 'text-blue-600' : 'text-gray-400'
          }`}
        >
          {tab.label}
          {active === tab.id && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
          )}
        </button>
      ))}
    </div>
  )
}
