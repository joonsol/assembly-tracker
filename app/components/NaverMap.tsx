'use client'

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react'

interface Member {
  mona_cd: string
  hg_nm: string
  poly_nm: string
  orig_nm: string
}

export interface MapHandle {
  loadSido: (sido: string) => void
  loadMembers: (members: Member[]) => void
  locateMe: () => void
}

const PARTY_COLOR: Record<string, string> = {
  '더불어민주당': '#004EA2',
  '국민의힘': '#E61E2B',
  '조국혁신당': '#00A0E9',
  '개혁신당': '#FF7210',
  '진보당': '#D6001C',
  '기본소득당': '#00C2B7',
  '사회민주당': '#F5A623',
}

function partyColor(poly_nm: string) {
  for (const [key, color] of Object.entries(PARTY_COLOR)) {
    if (poly_nm?.includes(key)) return color
  }
  return '#9CA3AF'
}

// 특례시·대도시 하위 구 → 상위 시 (GeoJSON이 구 단위로 나뉜 경우 매칭용)
const GU_TO_SI: Record<string, string> = {
  // 수원시
  '장안구': '수원시', '권선구': '수원시', '팔달구': '수원시', '영통구': '수원시',
  // 고양시
  '덕양구': '고양시', '일산동구': '고양시', '일산서구': '고양시',
  // 용인시
  '처인구': '용인시', '기흥구': '용인시', '수지구': '용인시',
  // 성남시
  '수정구': '성남시', '중원구': '성남시', '분당구': '성남시',
  // 안산시
  '단원구': '안산시', '상록구': '안산시',
  // 안양시
  '만안구': '안양시', '동안구': '안양시',
  // 청주시
  '상당구': '청주시', '서원구': '청주시', '흥덕구': '청주시', '청원구': '청주시',
  // 전주시
  '완산구': '전주시', '덕진구': '전주시',
  // 천안시
  '동남구': '천안시', '서북구': '천안시',
  // 창원시
  '의창구': '창원시', '성산구': '창원시', '마산합포구': '창원시', '마산회원구': '창원시', '진해구': '창원시',
  // 포항시
  '포항시 남구': '포항시', '포항시 북구': '포항시',
  // 화성시, 부천시 등은 구 없이 갑/을로 나뉨
}

// GeoJSON 행정코드 앞 2자리 → 시/도 (southkorea-maps 기준)
const CODE_SIDO: Record<string, string> = {
  '11': '서울',
  '21': '부산', '22': '대구', '23': '인천', '24': '광주', '25': '대전', '26': '울산',
  '29': '세종',
  '31': '경기', '32': '강원', '33': '충북', '34': '충남',
  '35': '전북', '36': '전남', '37': '경북', '38': '경남',
  '39': '제주',
  '51': '강원', '52': '전북', // 특별자치도 신코드
}

// 시/도 → 지도 중심 [lat, lng, zoom]
const SIDO_CENTER: Record<string, [number, number, number]> = {
  '서울': [37.5665, 126.978, 11], '부산': [35.1796, 129.0756, 11],
  '대구': [35.8714, 128.6014, 11], '인천': [37.4563, 126.7052, 11],
  '광주': [35.1595, 126.8526, 11], '대전': [36.3504, 127.3845, 11],
  '울산': [35.5384, 129.3114, 11], '세종': [36.48, 127.289, 12],
  '경기': [37.4138, 127.5183, 9], '강원': [37.8228, 128.1555, 9],
  '충북': [36.8, 127.7, 9], '충남': [36.5184, 126.8, 9],
  '전북': [35.7175, 127.153, 9], '전남': [34.8679, 126.991, 9],
  '경북': [36.4919, 128.8889, 9], '경남': [35.4606, 128.2132, 9],
  '제주': [33.4996, 126.5312, 10],
}

const SIDO_ALIAS: Record<string, string> = {
  '서울특별시': '서울', '부산광역시': '부산', '대구광역시': '대구',
  '인천광역시': '인천', '광주광역시': '광주', '대전광역시': '대전',
  '울산광역시': '울산', '세종특별자치시': '세종', '경기도': '경기',
  '강원특별자치도': '강원', '강원도': '강원', '충청북도': '충북',
  '충청남도': '충남', '전북특별자치도': '전북', '전라북도': '전북',
  '전라남도': '전남', '경상북도': '경북', '경상남도': '경남',
  '제주특별자치도': '제주',
}

const MapSection = forwardRef<MapHandle>(function MapSection(_, ref) {
  const mapDivRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<unknown>(null)
  const LRef = useRef<typeof import('leaflet') | null>(null)
  const geoLayerRef = useRef<unknown>(null)
  const myMarkerRef = useRef<unknown>(null)
  const badgeLayerRef = useRef<unknown>(null)
  const initPromiseRef = useRef<Promise<void> | null>(null)
  const allMembersRef = useRef<Member[]>([])

  const [loading, setLoading] = useState(true)
  const [info, setInfo] = useState<string | null>(null)

  // GeoJSON feature 이름 + 코드로 해당 의원들 찾기
  function findMembers(featureName: string, featureCode: string): Member[] {
    const codeStr = String(featureCode)
    const sido = CODE_SIDO[codeStr.substring(0, 2)] ?? ''

    const byName = (name: string) =>
      allMembersRef.current.filter((m) => {
        if (!m.orig_nm) return false
        return m.orig_nm.includes(name) && (sido ? m.orig_nm.includes(sido) : true)
      })

    // 1. 직접 매칭
    const direct = byName(featureName)
    if (direct.length > 0) return direct

    // 2. "수원시장안구" 형태 → 앞의 시 이름("수원시") 추출해서 매칭
    const siMatch = featureName.match(/^(.+?시)/)
    if (siMatch && siMatch[1] !== featureName) {
      const parentSi = siMatch[1]
      const byParent = byName(parentSi)
      if (byParent.length > 0) return byParent
    }

    // 3. 세종시 특수 처리 ("세종시" → "세종"으로도 시도)
    if (featureName.endsWith('시')) {
      const withoutSi = featureName.slice(0, -1)
      const byShorter = byName(withoutSi)
      if (byShorter.length > 0) return byShorter
    }

    // 4. sido 무시 fallback
    return allMembersRef.current.filter((m) => m.orig_nm?.includes(featureName))
  }

  function getStyle(members: Member[], highlighted = false) {
    const color = members.length > 0 ? partyColor(members[0].poly_nm) : '#D1D5DB'
    return {
      fillColor: color,
      fillOpacity: highlighted ? 0.85 : 0.55,
      color: highlighted ? '#1D4ED8' : '#fff',
      weight: highlighted ? 2.5 : 0.8,
    }
  }

  function buildGeoLayer(L: typeof import('leaflet'), geojson: unknown, highlightNames?: Set<string>) {
    const map = mapRef.current as ReturnType<typeof L.map>

    if (geoLayerRef.current) {
      ;(geoLayerRef.current as { remove: () => void }).remove()
    }

    const layer = L.geoJSON(geojson as Parameters<typeof L.geoJSON>[0], {
      style: (feature) => {
        if (!feature) return {}
        const name: string = feature.properties.name ?? ''
        const code: string = feature.properties.code ?? ''
        const members = findMembers(name, code)
        if (members.length === 0) console.log('[unmatched]', JSON.stringify(feature.properties))
        const highlighted = highlightNames ? highlightNames.has(name) : false
        return getStyle(members, highlighted)
      },
      onEachFeature: (feature, layer) => {
        const name: string = feature.properties.name ?? ''
        const code: string = feature.properties.code ?? ''
        const members = findMembers(name, code)

        // 의원 이름 툴팁
        const tooltipHtml = members.length > 0
          ? members.map(m =>
              `<span style="display:inline-block;padding:1px 6px;border-radius:10px;background:${partyColor(m.poly_nm)};color:white;font-size:11px;font-weight:700;margin:1px;">${m.hg_nm}</span>`
            ).join('')
          : `<span style="font-size:11px;color:#9CA3AF">${name}</span>`

        layer.bindTooltip(
          `<div style="line-height:1.8">${name}<br>${tooltipHtml}</div>`,
          { sticky: true, opacity: 1, className: 'assembly-tooltip' }
        )

        layer.on({
          mouseover(e) {
            ;(e.target as { setStyle: (s: object) => void }).setStyle({
              fillOpacity: 0.85,
              weight: 2,
              color: '#1D4ED8',
            })
          },
          mouseout() {
            ;(geoLayerRef.current as { resetStyle: (l: unknown) => void })?.resetStyle(layer)
          },
          click() {
            if (members.length === 1) {
              window.location.href = `/member/${members[0].mona_cd}`
            } else if (members.length > 1) {
              const popup = members.map(m =>
                `<a href="/member/${m.mona_cd}" style="display:block;padding:4px 0;font-weight:700;color:${partyColor(m.poly_nm)}">${m.hg_nm} <span style="font-size:10px;color:#6B7280">${m.poly_nm}</span></a>`
              ).join('<hr style="margin:2px 0;border-color:#e5e7eb">')
              layer.bindPopup(`<div style="min-width:140px"><b>${name}</b><br><br>${popup}</div>`).openPopup()
            }
          },
        })
      },
    }).addTo(map)

    geoLayerRef.current = layer
  }

  const initMap = async () => {
    if (initPromiseRef.current) return initPromiseRef.current
    initPromiseRef.current = (async () => {
      if (!mapDivRef.current) return
      const L = (await import('leaflet')).default
      await import('leaflet/dist/leaflet.css')
      LRef.current = L

      const map = L.map(mapDivRef.current, { zoomControl: true }).setView([36.5, 127.8], 7)
      mapRef.current = map
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
      }).addTo(map)

      // 전체 의원 + GeoJSON 병렬 로드
      const [membersRes, geoRes] = await Promise.all([
        fetch('/api/members'),
        fetch('https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2018/json/skorea-municipalities-2018-geo.json'),
      ])
      const [membersData, geojson] = await Promise.all([membersRes.json(), geoRes.json()])
      allMembersRef.current = Array.isArray(membersData) ? membersData : []

      buildGeoLayer(L, geojson)
      setLoading(false)
    })()
    return initPromiseRef.current
  }

  useImperativeHandle(ref, () => ({
    loadSido: async (sido: string) => {
      await initMap()
      const L = LRef.current!
      const map = mapRef.current as ReturnType<typeof L.map>
      const center = SIDO_CENTER[sido]
      if (center) map.setView([center[0], center[1]], center[2])

      const memberNames = new Set(
        allMembersRef.current
          .filter(m => m.orig_nm?.includes(sido))
          .map(m => {
            const parts = m.orig_nm.replace(/\s*[갑을병정무기]$/, '').trim().split(' ')
            return parts[parts.length - 1]
          })
      )
      setInfo(`${sido} · ${allMembersRef.current.filter(m => m.orig_nm?.includes(sido)).length}명`)

      // 지오레이어 재렌더링 (해당 시/도 강조)
      if (geoLayerRef.current && LRef.current) {
        const savedGeoJson = (geoLayerRef.current as { toGeoJSON: () => unknown }).toGeoJSON()
        buildGeoLayer(LRef.current, savedGeoJson, memberNames)
      }
    },

    loadMembers: async (members: Member[]) => {
      await initMap()
      const L = LRef.current!
      const map = mapRef.current as ReturnType<typeof L.map>

      // 이전 뱃지 마커 제거
      if (badgeLayerRef.current) {
        ;(badgeLayerRef.current as { remove: () => void }).remove()
        badgeLayerRef.current = null
      }

      const names = new Set(members.map(m => {
        const parts = m.orig_nm?.replace(/\s*[갑을병정무기]$/, '').trim().split(' ') ?? []
        return parts[parts.length - 1]
      }))
      setInfo(members.length > 0 ? members.map(m => m.hg_nm).join(', ') : null)

      if (geoLayerRef.current) {
        const savedGeoJson = (geoLayerRef.current as { toGeoJSON: () => unknown }).toGeoJSON()
        buildGeoLayer(L, savedGeoJson, names)
      }

      if (members.length === 0) return

      // 지역구 이름으로 좌표 조회 후 뱃지 마커 표시
      const badgeGroup = L.layerGroup().addTo(map)
      badgeLayerRef.current = badgeGroup

      const districtMap = new Map<string, Member[]>()
      for (const m of members) {
        const district = m.orig_nm?.replace(/\s*[갑을병정무기]$/, '').trim() ?? ''
        if (!district || district === '비례대표') continue
        if (!districtMap.has(district)) districtMap.set(district, [])
        districtMap.get(district)!.push(m)
      }

      const positions: [number, number][] = []

      await Promise.all(Array.from(districtMap.entries()).map(async ([district, group], gi) => {
        const res = await fetch(`/api/geocode-place?place=${encodeURIComponent(district)}`)
        if (!res.ok) return
        const { lat, lng } = await res.json()
        if (!lat || !lng) return

        group.forEach((m, i) => {
          const color = partyColor(m.poly_nm)
          const offsetLat = lat + (gi * 2 + i) * 0.004
          const offsetLng = lng + (gi * 2 + i) * 0.004
          positions.push([offsetLat, offsetLng])

          const html = `
            <div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;filter:drop-shadow(0 2px 8px rgba(0,0,0,0.3));">
              <div style="background:${color};color:white;font-size:12px;font-weight:800;
                padding:5px 12px;border-radius:20px;white-space:nowrap;border:2px solid white;">
                ${m.hg_nm}
              </div>
              <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid ${color};margin-top:-1px;"></div>
            </div>`

          const marker = L.marker([offsetLat, offsetLng], {
            icon: L.divIcon({ className: '', html, iconAnchor: [30, 38] }),
            zIndexOffset: 1000,
          }).addTo(badgeGroup)
          marker.on('click', () => { window.location.href = `/member/${m.mona_cd}` })
        })
      }))

      // 뱃지 마커 위치로 줌
      if (positions.length > 0) {
        if (positions.length === 1) {
          map.setView(positions[0], 13)
        } else {
          map.fitBounds(L.latLngBounds(positions), { padding: [60, 60] })
        }
      }
    },

    locateMe: async () => {
      if (!navigator.geolocation) return
      await initMap()
      const L = LRef.current!
      const map = mapRef.current as ReturnType<typeof L.map>

      navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        map.setView([lat, lng], 12)

        if (myMarkerRef.current) {
          ;(myMarkerRef.current as { remove: () => void }).remove()
        }
        myMarkerRef.current = L.marker([lat, lng], {
          icon: L.divIcon({
            className: '',
            html: `<div style="width:14px;height:14px;background:#2563eb;border:3px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(37,99,235,0.3);"></div>`,
            iconSize: [14, 14], iconAnchor: [7, 7],
          }),
        }).addTo(map)

        const geoRes = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`)
        const geo = await geoRes.json()
        if (!geo.error) {
          const sido = SIDO_ALIAS[geo.sido] ?? geo.sido
          setInfo(`📍 ${sido} ${geo.sigungu}`)
          const names = new Set([geo.sigungu])
          if (geoLayerRef.current) {
            const savedGeoJson = (geoLayerRef.current as { toGeoJSON: () => unknown }).toGeoJSON()
            buildGeoLayer(L, savedGeoJson, names)
          }
        }
      })
    },
  }))

  useEffect(() => {
    initMap()
    return () => {
      if (mapRef.current) {
        ;(mapRef.current as { remove: () => void }).remove()
      }
    }
  }, [])

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-1.5">
        <h2 className="text-xs font-semibold text-gray-400">지역구 지도</h2>
        {info && <span className="text-xs text-blue-600 font-medium truncate max-w-[60%] text-right">{info}</span>}
      </div>

      <div className="relative flex-1 overflow-hidden">
        <div ref={mapDivRef} className="w-full h-full bg-gray-100" />

        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50/90 z-[1000]">
            <span className="text-2xl animate-spin inline-block">⟳</span>
            <p className="text-sm text-gray-400 mt-2">지도 불러오는 중...</p>
          </div>
        )}

        {/* 범례 — 지도 위 좌하단 오버레이 */}
        {!loading && (
          <div className="absolute bottom-2 left-2 z-[1000] bg-white/90 rounded-lg px-2 py-1.5 flex flex-wrap gap-x-2 gap-y-0.5 max-w-[200px] shadow-sm">
            {Object.entries(PARTY_COLOR).map(([party, color]) => (
              <div key={party} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: color }} />
                <span className="text-[10px] text-gray-600">{party}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
})

export default MapSection
