/* global browser, chrome */

const storage =
  typeof browser !== 'undefined' && browser.storage?.local
    ? browser.storage.local
    : chrome.storage.local

const tabsApi = typeof browser !== 'undefined' && browser.tabs ? browser.tabs : chrome.tabs

const DEFAULT_ZEN_URL = 'http://127.0.0.1:5173/'
const STORAGE_KEY = 'ytzen_site_url'

function getVideoId() {
  const u = new URL(window.location.href)
  const v = u.searchParams.get('v')
  if (!v) return null
  // minimal validation (11 chars is typical)
  if (!/^[a-zA-Z0-9_-]{6,20}$/.test(v)) return null
  return v
}

async function getZenUrl() {
  const result = await storage.get(STORAGE_KEY)
  const raw = result?.[STORAGE_KEY]
  const url = typeof raw === 'string' && raw.trim().length > 0 ? raw.trim() : DEFAULT_ZEN_URL
  return url.endsWith('/') ? url : url + '/'
}

function ensureButton() {
  if (document.querySelector('.ytzen-btn')) return

  const btn = document.createElement('button')
  btn.className = 'ytzen-btn'
  btn.type = 'button'
  btn.textContent = 'Open in Zen'

  const updateEnabled = () => {
    const id = getVideoId()
    btn.disabled = !id
  }

  btn.addEventListener('click', async () => {
    const id = getVideoId()
    if (!id) return
    const zen = await getZenUrl()
    const target = `${zen}?v=${encodeURIComponent(id)}`
    tabsApi.create({ url: target })
  })

  document.documentElement.appendChild(btn)
  updateEnabled()

  // YouTube is a SPA; watch URL changes.
  let lastHref = window.location.href
  window.setInterval(() => {
    if (window.location.href !== lastHref) {
      lastHref = window.location.href
      updateEnabled()
    }
  }, 500)
}

ensureButton()

