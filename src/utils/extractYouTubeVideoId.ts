const YT_ID_RE = /^[a-zA-Z0-9_-]{11}$/

export function extractYouTubeVideoId(input: string): string | null {
  const raw = (input ?? '').trim()
  if (!raw) return null

  // Allow pasting just the ID
  if (YT_ID_RE.test(raw)) return raw

  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return null
  }

  const host = url.hostname.replace(/^www\./, '').toLowerCase()

  // youtu.be/<id>
  if (host === 'youtu.be') {
    const id = url.pathname.split('/').filter(Boolean)[0] ?? ''
    return YT_ID_RE.test(id) ? id : null
  }

  // youtube.com/watch?v=<id>
  if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
    if (url.pathname === '/watch') {
      const id = url.searchParams.get('v') ?? ''
      return YT_ID_RE.test(id) ? id : null
    }

    // youtube.com/embed/<id> or /shorts/<id>
    const parts = url.pathname.split('/').filter(Boolean)
    const maybeId = parts[1] ?? ''
    if (parts[0] === 'embed' || parts[0] === 'shorts') {
      return YT_ID_RE.test(maybeId) ? maybeId : null
    }
  }

  return null
}

