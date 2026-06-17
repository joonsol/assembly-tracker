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
          background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        {/* 국회의사당 아이콘 */}
        <div style={{ display: 'flex', marginBottom: 40 }}>
          <svg width="120" height="100" viewBox="0 0 120 100" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 55 Q60 5 110 55" fill="white" opacity="0.95" />
            <rect x="12" y="55" width="12" height="30" fill="white" opacity="0.9" />
            <rect x="30" y="55" width="12" height="30" fill="white" opacity="0.9" />
            <rect x="48" y="55" width="12" height="30" fill="white" opacity="0.9" />
            <rect x="66" y="55" width="12" height="30" fill="white" opacity="0.9" />
            <rect x="84" y="55" width="12" height="30" fill="white" opacity="0.9" />
            <rect x="8" y="85" width="104" height="8" rx="3" fill="white" />
            <line x1="61" y1="5" x2="61" y2="-8" stroke="white" strokeWidth="5" strokeLinecap="round" />
          </svg>
        </div>

        <div style={{ fontSize: 96, fontWeight: 800, color: 'white', letterSpacing: '-2px' }}>
          한눈에 국회의원
        </div>
        <div style={{ fontSize: 36, color: 'rgba(255,255,255,0.7)', marginTop: 20 }}>
          우리 지역 국회의원을 빠르게 찾아보세요
        </div>
      </div>
    ),
    { ...size }
  )
}
