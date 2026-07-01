'use client'

import { useEffect, useRef } from 'react'

interface Props {
  origNm: string
}

// 갑/을/병 제거 후 지역구 이름 추출
function districtName(orig_nm: string) {
  return orig_nm.replace(/\s*[갑을병정무기]$/, '').trim()
}

export default function MiniMap({ origNm }: Props) {
  const mapDivRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<unknown>(null)

  useEffect(() => {
    let destroyed = false

    ;(async () => {
      if (!mapDivRef.current || mapRef.current) return
      const L = (await import('leaflet')).default
      await import('leaflet/dist/leaflet.css')
      if (destroyed) return

      const map = L.map(mapDivRef.current, {
        zoomControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        touchZoom: false,
      }).setView([36.5, 127.8], 7)
      mapRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '',
      }).addTo(map)

      // 지역구 좌표 조회 후 하이라이트 마커
      const district = districtName(origNm)
      try {
        const res = await fetch(`/api/geocode-place?place=${encodeURIComponent(district)}`)
        if (res.ok) {
          const { lat, lng } = await res.json()
          if (lat && lng && !destroyed) {
            map.setView([lat, lng], 12)
            L.circleMarker([lat, lng], {
              radius: 14,
              color: '#2563eb',
              fillColor: '#3b82f6',
              fillOpacity: 0.35,
              weight: 2,
            }).addTo(map)
          }
        }
      } catch {}
    })()

    return () => {
      destroyed = true
      if (mapRef.current) {
        ;(mapRef.current as { remove: () => void }).remove()
        mapRef.current = null
      }
    }
  }, [origNm])

  return (
    <div ref={mapDivRef} className="w-full h-36 rounded-xl overflow-hidden border border-gray-100" />
  )
}
