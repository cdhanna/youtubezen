import { useEffect, useMemo, useRef, useState } from 'react'
import { loadYouTubeIFrameAPI } from '../utils/loadYouTubeIFrameAPI'

declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady?: () => void
  }
}

type Props = {
  videoId: string
  startSeconds?: number
  onProgressSeconds?: (seconds: number) => void
}

export function ZenPlayer({ videoId, startSeconds = 0, onProgressSeconds }: Props) {
  const containerId = useMemo(() => `yt-${videoId}-${Math.random().toString(16).slice(2)}`, [videoId])
  const playerRef = useRef<any>(null)
  const [ended, setEnded] = useState(false)
  const [ready, setReady] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPausedCover, setIsPausedCover] = useState(false)

  useEffect(() => {
    let cancelled = false

    setEnded(false)
    setReady(false)
    setIsPlaying(false)
    setIsPausedCover(false)

    loadYouTubeIFrameAPI()
      .then(() => {
        if (cancelled) return

        // Cleanup any prior player instance
        if (playerRef.current) {
          try {
            playerRef.current.destroy()
          } catch {
            // ignore
          }
          playerRef.current = null
        }

        const YT = window.YT
        playerRef.current = new YT.Player(containerId, {
          width: '100%',
          height: '100%',
          videoId,
          host: 'https://www.youtube-nocookie.com',
          playerVars: {
            autoplay: 0,
            controls: 1,
            fs: 1,
            playsinline: 1,
            modestbranding: 1,
            rel: 0,
            iv_load_policy: 3,
            disablekb: 0,
            cc_load_policy: 0
          },
          events: {
            onReady: () => {
              if (cancelled) return
              setReady(true)
              // Always come back to a paused state.
              setIsPausedCover(true)

              if (startSeconds > 0) {
                try {
                  playerRef.current?.seekTo?.(startSeconds, true)
                } catch {
                  // ignore
                }
              }

              // Some environments start playback after seeking/focus changes; force pause.
              try {
                playerRef.current?.pauseVideo?.()
              } catch {
                // ignore
              }
            },
            onStateChange: (e: any) => {
              if (cancelled) return
              if (e?.data === YT.PlayerState.ENDED) {
                setEnded(true)
                setIsPlaying(false)
                setIsPausedCover(false)
                try {
                  // Stop quickly so the end screen is less likely to flash behind overlay.
                  playerRef.current?.stopVideo?.()
                } catch {
                  // ignore
                }
              } else if (e?.data === YT.PlayerState.PLAYING) {
                setEnded(false)
                setIsPlaying(true)
                setIsPausedCover(false)
              } else if (e?.data === YT.PlayerState.PAUSED || e?.data === YT.PlayerState.BUFFERING) {
                setIsPlaying(false)
                setIsPausedCover(true)
              }
            },
          },
        })
      })
      .catch(() => {
        // If API fails to load, we'll just show a fallback message (handled in UI below)
      })

    return () => {
      cancelled = true
      if (playerRef.current) {
        try {
          playerRef.current.destroy()
        } catch {
          // ignore
        }
        playerRef.current = null
      }
    }
  }, [containerId, videoId])

  useEffect(() => {
    if (!ready) return

    const pause = () => {
      try {
        playerRef.current?.pauseVideo?.()
      } catch {
        // ignore
      }
    }

    const onVisibility = () => {
      if (document.hidden) pause()
    }

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('blur', pause)

    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('blur', pause)
    }
  }, [ready])

  useEffect(() => {
    if (!ready) return
    if (!onProgressSeconds) return

    let stopped = false
    const tick = () => {
      if (stopped) return
      if (!isPlaying) return
      try {
        const t = playerRef.current?.getCurrentTime?.()
        if (typeof t === 'number' && Number.isFinite(t)) onProgressSeconds(Math.floor(t))
      } catch {
        // ignore
      }
    }

    const id = window.setInterval(tick, 2000)
    return () => {
      stopped = true
      window.clearInterval(id)
    }
  }, [isPlaying, onProgressSeconds, ready])

  return (
    <section className="playerShell">
      <div className="playerFrame">
        <div className="player" id={containerId} />

        <div className={`fadeOverlay ${ended ? 'fadeOverlay--on' : ''}`} aria-hidden="true" />

        {ready && isPausedCover && !ended && (
          <button
            type="button"
            className="pauseCover"
            onClick={() => {
              try {
                playerRef.current?.playVideo?.()
              } catch {
                // ignore
              }
            }}
          >
            <span className="pauseCoverInner">
              <span className="pauseCoverTitle">Paused</span>
              <span className="pauseCoverBody">Click to resume</span>
            </span>
          </button>
        )}

        {!ready && (
          <div className="playerStatus">
            <div className="playerStatusCard">
              <div className="spinner" aria-hidden="true" />
              <div>
                <div className="playerStatusTitle">Loading player…</div>
                <div className="playerStatusBody">
                  If this never loads, an ad blocker or strict privacy setting might be blocking the YouTube
                  embed API.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

