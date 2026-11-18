// <img src> 에 넣을 주소. 서버(http 모드) 이미지는 로그인 토큰이 있어야 받을 수 있는데 <img> 는 헤더를 못 보내서,
// 토큰으로 받아 온 뒤 브라우저 안의 임시 주소(blob:)로 바꿔 줍니다. 그 밖의 주소는 그대로 돌려줘요.
import { useEffect, useState } from 'react'
import { BASE, fetchImage } from './http'

export function useImageSrc(url?: string): string | undefined {
  const fromServer = !!url && url.startsWith(`${BASE}/`)
  const [loaded, setLoaded] = useState<{ url: string; src: string }>()

  useEffect(() => {
    if (!fromServer) return
    let src: string | undefined
    let cancelled = false
    fetchImage(url)
      .then((blob) => {
        if (cancelled) return
        src = URL.createObjectURL(blob)
        setLoaded({ url, src })
      })
      .catch(() => {
        /* 못 받으면 이미지 없이 둡니다 */
      })
    return () => {
      cancelled = true
      if (src) URL.revokeObjectURL(src)
    }
  }, [fromServer, url])

  if (!fromServer) return url
  return loaded?.url === url ? loaded.src : undefined
}
