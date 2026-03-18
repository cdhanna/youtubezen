/* global browser, chrome */

const storage =
  typeof browser !== 'undefined' && browser.storage?.local
    ? browser.storage.local
    : chrome.storage.local

const runtime = typeof browser !== 'undefined' ? browser.runtime : chrome.runtime

const DEFAULT_ZEN_URL = 'http://127.0.0.1:5173/'
const STORAGE_KEY = 'ytzen_site_url'

const YT_ID_RE = /^[a-zA-Z0-9_-]{6,20}$/

function getVideoId() {
  try {
    const u = new URL(window.location.href)
    const host = u.hostname.replace(/^www\./, '').toLowerCase()

    if (host === 'youtu.be') {
      const id = u.pathname.split('/').filter(Boolean)[0] ?? ''
      return YT_ID_RE.test(id) ? id : null
    }

    if (host.includes('youtube.com')) {
      if (u.pathname === '/watch') {
        const v = u.searchParams.get('v') ?? ''
        return YT_ID_RE.test(v) ? v : null
      }
      const parts = u.pathname.split('/').filter(Boolean)
      const maybeId = parts[1] ?? ''
      if (parts[0] === 'embed' || parts[0] === 'shorts' || parts[0] === 'v') {
        return YT_ID_RE.test(maybeId) ? maybeId : null
      }
    }
  } catch {
    // ignore
  }
  return null
}

async function getZenUrl() {
  const result = await storage.get(STORAGE_KEY)
  const raw = result?.[STORAGE_KEY]
  const url = typeof raw === 'string' && raw.trim().length > 0 ? raw.trim() : DEFAULT_ZEN_URL
  return url.endsWith('/') ? url : url + '/'
}

function ensureButton() {
  if (document.querySelector('.ytzen-wrapper')) return

  const wrapper = document.createElement('div')
  wrapper.className = 'ytzen-wrapper'

  const btn = document.createElement('button')
  btn.className = 'ytzen-btn'
  btn.type = 'button'
  btn.textContent = 'Open in Zen'

  const updateEnabled = () => {
    const id = getVideoId()
    btn.disabled = !id
  }

  btn.addEventListener('click', async (e) => {
    e.preventDefault()
    e.stopPropagation()
    const id = getVideoId()
    if (!id) return
    const zen = await getZenUrl()
    const target = `${zen}?v=${encodeURIComponent(id)}`
    runtime.sendMessage({ type: 'OPEN_ZEN', url: target })
  })

  wrapper.appendChild(btn)
  document.body.appendChild(wrapper)
  updateEnabled()

  // YouTube is a SPA; watch URL changes.
  let lastHref = window.location.href
  const checkUrl = () => {
    if (window.location.href !== lastHref) {
      lastHref = window.location.href
      updateEnabled()
    }
  }
  window.setInterval(checkUrl, 300)
  window.addEventListener('popstate', updateEnabled)
  // Re-check after a short delay (SPA may update URL after load)
  setTimeout(updateEnabled, 500)
}

ensureButton()

