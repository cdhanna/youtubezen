# YouTube Zen

Paste a YouTube link and watch in a minimal player.

Key behavior:
- The page shows **only** the player (no “Up next” sidebar UI).
- When playback ends, the player is covered by a **fade-to-black overlay** so you don’t see YouTube’s end-screen suggestions.

## Local development

Prereqs: Node.js (works on Node 16+).

```bash
npm install
npm run dev
```

Then open the printed local URL (usually `http://localhost:5173`).

## Build / preview

```bash
npm run build
npm run preview
```

The production build outputs to `dist/`.

## Deploy

This is a static site (Vite). You can deploy `dist/` to:
- Netlify
- Vercel
- GitHub Pages (with a small base-path tweak if needed)

