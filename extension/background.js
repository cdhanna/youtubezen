/* global browser, chrome */

const runtime = typeof browser !== 'undefined' ? browser.runtime : chrome.runtime

runtime.onMessage.addListener((message) => {
  if (message.type === 'OPEN_ZEN' && message.url) {
    const tabsApi = typeof browser !== 'undefined' && browser.tabs ? browser.tabs : chrome.tabs
    tabsApi.create({ url: message.url })
  }
})
