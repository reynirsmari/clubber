# Clubbr — Zero-build static site

This repo is ready to deploy on Netlify without running any build.

- `index.html` (tiny shim) redirects to `index_real.html`
- `index_real.html` is the full app (vanilla JS)
- `netlify.toml` sets publish directory to the repo root and **no build command**
- `_redirects` ensures SPA routing

## Deploy (Git Import)

1. Push these files to a GitHub repo (at repo root).
2. On Netlify → Add new site → Import from Git.
3. Confirm:
   - Build command: _empty_
   - Publish directory: _empty_ (Netlify reads from `netlify.toml` → `.`)

If an older configuration still points to `dist/`, go to **Site settings → Build & deploy**, set **Publish directory** blank, and click **Save**. Then trigger a redeploy from the latest commit.

## Deploy (drag & drop)
Drag this entire folder onto Netlify Deploys → Deploy a site (no build).

