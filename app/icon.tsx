import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: 'linear-gradient(135deg, #1e40af, #2563eb)',
          borderRadius: 6,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          paddingBottom: 3,
        }}
      >
        <svg width="24" height="20" viewBox="0 0 24 20" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 11 Q12 1 22 11" fill="white" />
          <rect x="2" y="11" width="3" height="6" fill="white" />
          <rect x="7" y="11" width="3" height="6" fill="white" />
          <rect x="12" y="11" width="3" height="6" fill="white" />
          <rect x="17" y="11" width="3" height="6" fill="white" />
          <rect x="1" y="17" width="22" height="2" rx="1" fill="white" />
        </svg>
      </div>
    ),
    { ...size }
  )
}
