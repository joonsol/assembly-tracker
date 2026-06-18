'use client'

import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const handleKakaoLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-sm text-center">
        <img src="/logo2.svg" alt="한눈에 국회의원" className="w-50 mx-auto mb-6" />
        <p className="text-gray-500 text-sm mb-8">로그인하고 더 많은 기능을 이용해보세요</p>
        <button
          onClick={handleKakaoLogin}
          className="w-full flex items-center justify-center gap-3 bg-[#FEE500] text-[#191919] font-semibold py-3 rounded-xl text-sm hover:bg-[#f0d800] transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M10 2C5.582 2 2 4.925 2 8.5c0 2.26 1.37 4.25 3.44 5.44L4.5 18l4.17-2.77c.44.06.88.09 1.33.09 4.418 0 8-2.925 8-6.5S14.418 2 10 2z"
              fill="#191919"
            />
          </svg>
          카카오로 시작하기
        </button>
        <a
          href="/api/auth/naver"
          className="mt-3 w-full flex items-center justify-center gap-3 bg-[#03C75A] text-white font-semibold py-3 rounded-xl text-sm hover:bg-[#02b351] transition-colors"
        >
          <img src="/naver-svgrepo-com.svg" alt="naver logo"  className='w-4'/>

          네이버로 시작하기
        </a>
      </div>
    </main>
  )
}
