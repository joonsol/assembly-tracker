'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/', icon: '🗺', label: '지도' },
  { href: '/compare', icon: '⚖', label: '비교' },
  { href: '/mypage', icon: '👤', label: '마이페이지' },
]

export default function BottomNav() {
  const pathname = usePathname()

  if (pathname === '/login') return null

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 flex safe-bottom" style={{ zIndex: 9000 }}>
      {NAV.map(({ href, icon, label }) => {
        const active = pathname === href || (href !== '/' && pathname.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors ${
              active ? 'text-blue-600' : 'text-gray-400'
            }`}
          >
            <span className="text-xl leading-none">{icon}</span>
            <span className={`text-[10px] font-medium ${active ? 'text-blue-600' : 'text-gray-400'}`}>
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
