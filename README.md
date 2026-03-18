# YouTube Zen

This repo contains:
- `webApp/`: the distraction-free YouTube player website (Vite + React)
- `extension/`: a Firefox extension that adds a “Open in YouTube Zen” button on YouTube watch pages

## Run the website locally

```bash
cd webApp
npm install
npm run dev
```

## Build the website

```bash
cd webApp
npm run build
npm run preview
```

## Deploy to GitHub Pages

This project is set up to deploy the `webApp/` build output to GitHub Pages via GitHub Actions.

1. In GitHub: **Settings → Pages**
2. Set **Build and deployment** to **GitHub Actions**
3. Push to `master` (or your default branch)

After the first successful workflow run, your site will be available at:
`https://<your-username>.github.io/<repo-name>/`

If your repo name is `youtubezen`, that will be:
`https://<your-username>.github.io/youtubezen/`

## Firefox extension

**Option A — Temporary (recommended for testing):**
1. Firefox → `about:debugging` → “This Firefox”
2. “Load Temporary Add-on…”
3. Select `extension/manifest.json`

**Option B — Install from downloaded .xpi:**
1. Download the extension from the site (click “Install Firefox extension”)
2. In Firefox: `about:addons` → gear icon → “Install Add-on From File” → select the .xpi

If you get “appears to be corrupt,” Firefox may be blocking unsigned extensions. In `about:config`, set `xpinstall.signatures.required` to `false` (Developer Edition/Nightly only; regular Firefox ignores this).

In the extension’s options, set your Zen site URL (local or deployed).

