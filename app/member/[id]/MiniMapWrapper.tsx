'use client'

import dynamic from 'next/dynamic'

const MiniMap = dynamic(() => import('./MiniMap'), { ssr: false })

export default function MiniMapWrapper({ origNm }: { origNm: string }) {
    return <MiniMap origNm={origNm} />
}
