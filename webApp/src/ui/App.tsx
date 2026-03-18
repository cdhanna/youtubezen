import { useEffect, useMemo, useRef, useState } from 'react'
import { extractYouTubeVideoId } from '../utils/extractYouTubeVideoId'
import { fetchYouTubeTitle } from '../utils/fetchYouTubeTitle'
import { useLocalStorageState } from '../utils/useLocalStorageState'
import { ZenPlayer } from './ZenPlayer'

const EXAMPLE = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'

type VideoCard = {
  videoId: string
  url: string
  title: string
  addedAt: number
  lastSeconds: number
}

const STORAGE_KEY = 'youtube-zen:v1'

export function App() {
  const [input, setInput] = useState('')
  const [cards, setCards] = useLocalStorageState<VideoCard[]>(STORAGE_KEY, [])
  const [activeVideoId, setActiveVideoId] = useLocalStorageState<string | null>(
    `${STORAGE_KEY}:active`,
    null,
  )
  const [isAdding, setIsAdding] = useState(false)

  const inputVideoId = useMemo(() => extractYouTubeVideoId(input), [input])
  const activeCard = useMemo(
    () => (activeVideoId ? cards.find((c) => c.videoId === activeVideoId) ?? null : null),
    [activeVideoId, cards],
  )

  const isMinimized = Boolean(activeVideoId) && !isAdding
  const [extensionDropdownOpen, setExtensionDropdownOpen] = useState(false)
  const [extensionCopied, setExtensionCopied] = useState(false)
  const extensionDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!extensionDropdownOpen) return
    const onDocClick = (e: MouseEvent) => {
      if (extensionDropdownRef.current && !extensionDropdownRef.current.contains(e.target as Node)) {
        setExtensionDropdownOpen(false)
      }
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [extensionDropdownOpen])

  // Allow opening the site with a preloaded video:
  //   /?v=<videoId>
  // Optional:
  //   /?v=<videoId>&t=<seconds>
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const v = params.get('v') ?? ''
    const id = extractYouTubeVideoId(v)
    if (!id) return

    const tRaw = params.get('t')
    const t = tRaw ? Number.parseInt(tRaw, 10) : 0
    const start = Number.isFinite(t) && t > 0 ? t : 0

    setCards((prev) => {
      const existing = prev.find((p) => p.videoId === id)
      if (existing) {
        return prev.map((p) =>
          p.videoId === id ? { ...p, lastSeconds: Math.max(p.lastSeconds, start) } : p,
        )
      }
      return [
        { videoId: id, url: `https://www.youtube.com/watch?v=${id}`, title: '', addedAt: Date.now(), lastSeconds: start },
        ...prev,
      ]
    })

    setActiveVideoId(id)
    setIsAdding(false)
    // Clean up URL so refresh doesn't re-add.
    window.history.replaceState({}, document.title, window.location.pathname)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    let cancelled = false

    const missing = cards.filter((c) => !c.title || c.title.trim().length === 0)
    if (missing.length === 0) return

    const run = async () => {
      for (const c of missing) {
        const title = await fetchYouTubeTitle(c.videoId)
        if (cancelled) return
        if (!title) continue
        setCards((prev) =>
          prev.map((x) => (x.videoId === c.videoId ? { ...x, title } : x)),
        )
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [cards, setCards])

  return (
    <div className="page">
      <div className="grain" aria-hidden="true" />

      <header className={`header ${isMinimized ? 'header--min' : ''}`}>
        {!isMinimized && (
          <div className="brand">
            <div className="logo" aria-hidden="true">
              <span className="logoDot" />
            </div>
            <div>
              <div className="title">YouTube Zen</div>
              <div className="subtitle">Paste a link. Watch without noise.</div>
            </div>
          </div>
        )}

        <div className="topRow">
          <div className="cardsBar" role="list" aria-label="Saved videos">
            {cards.map((c) => {
              const isActive = c.videoId === activeVideoId
              return (
                <div
                  key={c.videoId}
                  className={`cardChip ${isActive ? 'cardChip--active' : ''}`}
                  role="listitem"
                >
                  <button
                    type="button"
                    className="cardChipMain"
                    onClick={() => {
                      setActiveVideoId(c.videoId)
                      setIsAdding(false)
                    }}
                    title={c.url}
                  >
                    <span className="cardMeta">
                      <span className="cardTitle">{c.title || c.videoId}</span>
                      <span className="cardTime">{formatSeconds(c.lastSeconds)}</span>
                    </span>
                  </button>

                  <button
                    type="button"
                    className="cardRemove"
                    aria-label="Remove video card"
                    title="Remove"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setCards((prev) => prev.filter((x) => x.videoId !== c.videoId))
                      if (activeVideoId === c.videoId) {
                        setActiveVideoId(null)
                        setIsAdding(false)
                      }
                    }}
                  >
                    ×
                  </button>
                </div>
              )
            })}
          </div>

          <div className="topActions">
            {activeVideoId ? (
              <button
                type="button"
                className="button button--ghost"
                onClick={() => setIsAdding((v) => !v)}
              >
                {isAdding ? 'Close' : 'Add'}
              </button>
            ) : null}
            {cards.length > 0 ? (
              <button
                type="button"
                className="button button--ghost"
                onClick={() => {
                  setCards([])
                  setActiveVideoId(null)
                  setIsAdding(false)
                }}
              >
                Clear
              </button>
            ) : null}
          </div>
        </div>

        {!isMinimized && (
          <form
            className="controls"
            onSubmit={(e) => {
              e.preventDefault()
              const url = input.trim()
              const id = extractYouTubeVideoId(url)
              if (!id) return

              setCards((prev) => {
                const existing = prev.find((p) => p.videoId === id)
                if (existing) {
                  return prev.map((p) => (p.videoId === id ? { ...p, url, title: p.title ?? '' } : p))
                }
                return [{ videoId: id, url, title: '', addedAt: Date.now(), lastSeconds: 0 }, ...prev]
              })

              setActiveVideoId(id)
              setInput('')
              setIsAdding(false)
            }}
          >
            <label className="srOnly" htmlFor="yturl">
              YouTube URL
            </label>
            <input
              id="yturl"
              className="input"
              inputMode="url"
              placeholder={`Paste a YouTube link (e.g. ${EXAMPLE})`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button className="button" type="submit" disabled={!inputVideoId}>
              Play
            </button>
          </form>
        )}

        {!isMinimized && (
          <div className="hint">
            {input.length === 0 ? (
              <>Tip: paste any `youtube.com` / `youtu.be` URL.</>
            ) : inputVideoId ? (
              <>
                Looks good. Video ID: <code>{inputVideoId}</code>
              </>
            ) : (
              <>I can’t find a video ID in that link.</>
            )}
          </div>
        )}
      </header>

      <main className="main">
        {activeVideoId ? (
          <ZenPlayer
            videoId={activeVideoId}
            startSeconds={activeCard?.lastSeconds ?? 0}
            onProgressSeconds={(seconds) => {
              setCards((prev) =>
                prev.map((c) => (c.videoId === activeVideoId ? { ...c, lastSeconds: seconds } : c)),
              )
            }}
          />
        ) : null}
      </main>

      <footer className="footer">
        {activeVideoId && (
          <span className="footerEmbed">
            Uses YouTube’s embedded player. Suggestions are covered with a fade
            overlay when playback ends.
          </span>
        )}
        <div className="footerExtensionWrap" ref={extensionDropdownRef}>
          <a
            href={`${import.meta.env.BASE_URL}youtubezen-extension.xpi`}
            className="footerExtensionBtn"
            download="youtubezen-extension.xpi"
          >
            Download Extension
          </a>
          <button
            type="button"
            className="footerExtensionDropdownTrigger"
            onClick={() => setExtensionDropdownOpen((o) => !o)}
            aria-expanded={extensionDropdownOpen}
            aria-haspopup="true"
            title="More options"
          >
            ▾
          </button>
          {extensionDropdownOpen && (
            <div className="footerExtensionDropdown">
              <button
                type="button"
                className="footerExtensionDropdownItem"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText('about:debugging#/runtime/this-firefox')
                    setExtensionCopied(true)
                    setTimeout(() => {
                      setExtensionCopied(false)
                      setExtensionDropdownOpen(false)
                    }, 1200)
                  } catch {
                    // ignore
                  }
                }}
              >
                {extensionCopied ? 'Copied!' : 'Copy Firefox Config Url'}
              </button>
              <p className="footerExtensionDropdownHint">
                Paste into a new tab to load the extension in Firefox.
              </p>
            </div>
          )}
        </div>
      </footer>
    </div>
  )
}

function formatSeconds(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds || 0))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = s % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
  return `${m}:${String(ss).padStart(2, '0')}`
}

