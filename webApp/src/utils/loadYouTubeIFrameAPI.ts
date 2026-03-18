let loadingPromise: Promise<void> | null = null

export function loadYouTubeIFrameAPI(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('window not available'))

  // Already loaded
  if ((window as any).YT?.Player) return Promise.resolve()

  if (loadingPromise) return loadingPromise

  loadingPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-youtube-iframe-api="true"]')
    if (existing) {
      // If script exists, wait for ready callback
      const prev = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => {
        prev?.()
        resolve()
      }
      // If it *already* loaded between checks
      const t = window.setInterval(() => {
        if ((window as any).YT?.Player) {
          window.clearInterval(t)
          resolve()
        }
      }, 50)
      window.setTimeout(() => {
        window.clearInterval(t)
        reject(new Error('Timed out loading YouTube IFrame API'))
      }, 15000)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://www.youtube.com/iframe_api'
    script.async = true
    script.defer = true
    script.dataset.youtubeIframeApi = 'true'

    const prev = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      prev?.()
      resolve()
    }

    script.onerror = () => reject(new Error('Failed to load YouTube IFrame API'))

    document.head.appendChild(script)

    // Safety timeout
    window.setTimeout(() => {
      if (!(window as any).YT?.Player) reject(new Error('Timed out loading YouTube IFrame API'))
    }, 15000)
  })

  return loadingPromise
}

