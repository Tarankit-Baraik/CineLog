# Deploying the CineLog Frontend to Vercel

Vercel hosts the **frontend only**. The backend is a persistent Express
server (not a serverless function) and belongs on Render or Railway - see
the Deployment section of the root `README.md`.

## Why this needs a small config, not a plain drag-and-drop

The frontend has no build step by design (`frontend/public/index.html` +
`frontend/src/*.js` served directly as native ES modules). Its structure
puts `index.html` inside `public/`, one level below the project root, with
`src/` as a sibling. This repo already handles the two things that
structure needs for a clean deploy:

- `frontend/public/index.html` references its script and stylesheet with
  **absolute** paths (`/src/main.js`, `/src/styles/main.css`), so they
  resolve correctly regardless of what URL the browser thinks it's on.
- `frontend/vercel.json` rewrites the root URL (`/`) to serve
  `/public/index.html`, so visiting your `*.vercel.app` domain shows the
  app instead of a 404.

You don't need to change either of these - they're already in place.

## 1. Deploy the backend first

The frontend needs a live backend URL to actually work once deployed.
Deploy `backend/` to Render or Railway first (root directory `backend`,
build command `npm install`, start command `npm start`, all six `.env`
values added as environment variables on that platform's dashboard). Note
the URL it gives you, e.g. `https://cinelog-backend.onrender.com`.

## 2. Point the frontend at your backend

Edit `frontend/public/index.html`:

```html
<script>
  window.CINELOG_API_URL = 'https://cinelog-backend.onrender.com/api';
</script>
```

Replace the URL with your actual backend URL, keeping the `/api` suffix.
Commit and push this change (see `docs/github-upload.md` if you haven't
pushed the repo yet).

## 3. Import the project into Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and sign in with GitHub.
2. Import the `cinelog` repository.
3. In the project configuration screen:
   - **Root Directory**: click Edit, select `frontend`.
   - **Framework Preset**: Other (no framework to detect - there's no
     build step).
   - **Build Command**: leave empty.
   - **Output Directory**: leave on the default.
4. Click **Deploy**.

Vercel picks up `frontend/vercel.json` automatically once the root
directory is set to `frontend` - no extra configuration needed there.

## 4. Verify

Once the deploy finishes, open the `*.vercel.app` URL Vercel gives you.

- The root URL should load the CineLog login screen (proves the rewrite
  worked).
- Open your browser's dev tools → Network tab, and register or log in.
  Confirm the request goes to your Render/Railway backend URL, not
  `localhost` (proves step 2 took effect).
- If login fails with a network/CORS error, double-check the backend is
  actually running and that the URL in `index.html` has no typo.

## Future deploys

Vercel watches the GitHub branch you imported from - every push to it
triggers a new deploy automatically. No manual redeploy step needed.

## Custom domain (optional)

Project → Settings → Domains in the Vercel dashboard. Not covered in detail
here since it's unrelated to this project's specific setup - Vercel's own
domain docs cover it well.
