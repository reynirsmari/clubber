# Golf Club Selector (Netlify-ready)

## Deploy on Netlify (Git)

1. Fork or push this folder to a new repo.
2. On Netlify: **Add new site → Import from Git**.
3. Set:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
4. Deploy.

## Deploy on Netlify (drag & drop)

1. Run locally:
   ```bash
   npm install
   npm run build
   ```
2. Drag the generated `dist/` folder onto Netlify's **Deploys → Deploy a site**.
3. Done.

> We include both `netlify.toml` and `public/_redirects` so SPA routes resolve to `/index.html` (prevents 404s).

## Dev
```bash
npm install
npm run dev
```

