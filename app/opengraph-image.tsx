import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = '한눈에 국회의원'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f2d7a 0%, #1e40af 50%, #2563eb 100%)',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* 배경 원형 장식 */}
        <div style={{
          position: 'absolute', top: -120, right: -120,
          width: 500, height: 500, borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)', display: 'flex',
        }} />
        <div style={{
          position: 'absolute', bottom: -80, left: -80,
          width: 350, height: 350, borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)', display: 'flex',
        }} />

        {/* 국회의사당 아이콘 */}
        <div style={{ display: 'flex', marginBottom: 48 }}>
          <svg width="200" height="160" viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg">
            {/* 첨탑 */}
            <line x1="100" y1="0" x2="100" y2="20" stroke="white" strokeWidth="6" strokeLinecap="round" />
            {/* 돔 */}
            <path d="M15 90 Q100 20 185 90" fill="white" />
            {/* 기둥 6개 */}
            <rect x="18" y="90" width="16" height="44" rx="2" fill="rgba(255,255,255,0.92)" />
            <rect x="46" y="90" width="16" height="44" rx="2" fill="rgba(255,255,255,0.92)" />
            <rect x="74" y="90" width="16" height="44" rx="2" fill="rgba(255,255,255,0.92)" />
            <rect x="102" y="90" width="16" height="44" rx="2" fill="rgba(255,255,255,0.92)" />
            <rect x="130" y="90" width="16" height="44" rx="2" fill="rgba(255,255,255,0.92)" />
            <rect x="158" y="90" width="16" height="44" rx="2" fill="rgba(255,255,255,0.92)" />
            {/* 기단 */}
            <rect x="8" y="134" width="184" height="14" rx="4" fill="white" />
            <rect x="0" y="148" width="200" height="10" rx="3" fill="rgba(255,255,255,0.7)" />
          </svg>
        </div>

        {/* 메인 타이틀 */}
        <div style={{
          fontSize: 100, fontWeight: 800, color: 'white',
          letterSpacing: '-3px', lineHeight: 1,
          textShadow: '0 4px 24px rgba(0,0,0,0.2)',
          display: 'flex',
        }}>
          한눈에 국회의원
        </div>

        {/* 구분선 */}
        <div style={{
          width: 80, height: 4, borderRadius: 2,
          background: 'rgba(255,255,255,0.4)',
          marginTop: 32, marginBottom: 28, display: 'flex',
        }} />

        {/* 부제 */}
        <div style={{
          fontSize: 38, color: 'rgba(255,255,255,0.75)',
          fontWeight: 400, letterSpacing: '0px', display: 'flex',
        }}>
          우리 지역 국회의원을 빠르게 찾아보세요
        </div>
      </div>
    ),
    { ...size }
  )
}
