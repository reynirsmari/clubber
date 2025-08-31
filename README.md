# Clubbr — Zero-build HTML app

Single-file HTML + JS + CSS app with a logo. No build step required.

## Deploy on Netlify (Git)
1. Push these files to a GitHub repo (root level).
2. On Netlify: Add new site → Import from Git.
3. Build settings: leave **Build command** empty. Leave **Publish directory** empty (Netlify will read `netlify.toml` → publish `.`).

## Drag-and-drop
1. Zip the folder contents and drag to Netlify → Deploys → Deploy a site.
2. Or drag the unzipped folder directly.

The app stores your edited bag distances in `localStorage` under the key `clubbr_bag`.
