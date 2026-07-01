'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

const FEATURES = [
  {
    icon: '🗺️',
    title: '지역구 지도',
    desc: '내 위치 기반으로 우리 지역구 국회의원을 지도에서 바로 확인하세요.',
  },
  {
    icon: '🔍',
    title: '의원 검색',
    desc: '이름 또는 지역으로 빠르게 검색하고 의정활동 통계를 한눈에 보세요.',
  },
  {
    icon: '⚖️',
    title: '의원 비교',
    desc: '두 의원의 법안 발의·투표·출석 현황을 나란히 비교해보세요.',
  },
  {
    icon: '★',
    title: '즐겨찾기',
    desc: '관심 의원을 저장하고 마이페이지에서 빠르게 다시 확인하세요.',
  },
]

export default function LoginPage() {
  const [step, setStep] = useState(0) // 0~3: 온보딩, 4: 로그인

  const handleKakaoLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  // 온보딩 슬라이드
  if (step < FEATURES.length) {
    const f = FEATURES[step]
    return (
      <main className="min-h-screen bg-blue-600 flex flex-col items-center justify-between px-6 py-12">
        {/* 로고 */}
        <img src="/logo.svg" alt="한눈에 국회의원" className="h-8 opacity-80" />

        {/* 슬라이드 내용 */}
        <div className="text-center text-white">
          <div className="text-7xl mb-6">{f.icon}</div>
          <h2 className="text-2xl font-bold mb-3">{f.title}</h2>
          <p className="text-blue-100 text-base leading-relaxed max-w-xs mx-auto">{f.desc}</p>
        </div>

        {/* 하단 */}
        <div className="w-full max-w-xs space-y-4">
          {/* 점 인디케이터 */}
          <div className="flex justify-center gap-2">
            {FEATURES.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all ${i === step ? 'bg-white w-5' : 'bg-blue-400'}`}
              />
            ))}
          </div>

          <button
            onClick={() => setStep(step + 1)}
            className="w-full bg-white text-blue-600 font-bold py-3.5 rounded-2xl text-base"
          >
            {step < FEATURES.length - 1 ? '다음' : '시작하기'}
          </button>

          {step < FEATURES.length - 1 && (
            <button
              onClick={() => setStep(FEATURES.length)}
              className="w-full text-blue-200 text-sm py-2"
            >
              건너뛰기
            </button>
          )}
        </div>
      </main>
    )
  }

  // 로그인 화면
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-sm text-center">
        <img src="/logo2.svg" alt="한눈에 국회의원" className="w-50 mx-auto mb-4" />
        <p className="text-gray-500 text-sm mb-8">로그인하고 더 많은 기능을 이용해보세요</p>

        <button
          onClick={handleKakaoLogin}
          className="w-full flex items-center justify-center gap-3 bg-[#FEE500] text-[#191919] font-semibold py-3.5 rounded-xl text-sm hover:bg-[#f0d800] transition-colors"
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
          className="mt-3 w-full flex items-center justify-center gap-3 bg-[#03C75A] text-white font-semibold py-3.5 rounded-xl text-sm hover:bg-[#02b351] transition-colors"
        >
          <img src="/naver-svgrepo-com.svg" alt="naver logo" className="w-4" />
          네이버로 시작하기
        </a>

        <button
          onClick={handleGoogleLogin}
          className="mt-3 w-full flex items-center justify-center gap-3 bg-white text-gray-700 font-semibold py-3.5 rounded-xl text-sm border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
            <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          Google로 시작하기
        </button>

        <button
          onClick={() => setStep(0)}
          className="mt-6 text-xs text-gray-400 underline"
        >
          앱 소개 다시 보기
        </button>
      </div>
    </main>
  )
}
