/* global browser, chrome */

const storage =
  typeof browser !== 'undefined' && browser.storage?.local
    ? browser.storage.local
    : chrome.storage.local

const STORAGE_KEY = 'ytzen_site_url'
const DEFAULT_ZEN_URL = 'https://cdhanna.github.io/youtubezen/'

function normalize(url) {
  const u = (url || '').trim()
  if (!u) return DEFAULT_ZEN_URL
  try {
    const parsed = new URL(u)
    return parsed.toString()
  } catch {
    return DEFAULT_ZEN_URL
  }
}

async function load() {
  const result = await storage.get(STORAGE_KEY)
  const raw = result?.[STORAGE_KEY]
  document.getElementById('url').value =
    typeof raw === 'string' && raw.trim().length > 0 ? raw.trim() : DEFAULT_ZEN_URL
}

async function save() {
  const input = document.getElementById('url').value
  const url = normalize(input)
  await storage.set({ [STORAGE_KEY]: url })
  const el = document.getElementById('status')
  el.textContent = `Saved: ${url}`
  setTimeout(() => {
    el.textContent = ''
  }, 1800)
}

document.getElementById('save').addEventListener('click', () => void save())
void load()

