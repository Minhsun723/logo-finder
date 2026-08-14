# Logo Finder migration

This folder keeps the migration additive: the original Tkinter program remains available while the reusable API logic lives in `backend/` and the web interface lives in `frontend/`.

## Local development

Backend:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
# Set IQIYI_DEVICE_ID, IQIYI_UUID and IQIYI_SID in the process environment.
uvicorn app.main:app --reload --port 8000
```

Frontend:

```powershell
cd frontend
npm install
npm run dev
```

Run verification with `python -m pytest -q` in `backend/`, then `npm test` and `npm run build` in `frontend/`.

## Production deployment

Deploy the API first so its public URL can be embedded in the Vite production build.

### 1. Google Cloud Run backend

Install and authenticate the Google Cloud CLI, select a billing-enabled project, then run from `backend/`:

```powershell
gcloud auth login
gcloud config set project ascooo-logo-finder-20260814
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
gcloud run deploy logo-finder-api `
  --source . `
  --region asia-east1 `
  --allow-unauthenticated `
  --port 8080 `
  --memory 512Mi `
  --min-instances 0 `
  --max-instances 1 `
  --env-vars-file .env
```

The local `.env` is used to configure Cloud Run but is excluded from the uploaded source and Git. Verify the URL returned by Cloud Run:

```powershell
Invoke-RestMethod https://YOUR_CLOUD_RUN_URL/api/health
```

### 2. Cloudflare Pages frontend

The Pages project is connected to `Minhsun723/logo-finder` and automatically deploys pushes to `main` with these settings:

- Root directory: `frontend`
- Build command: `npm run build`
- Build output directory: `dist`
- Production branch: `main`

The production API URL is committed in `frontend/.env.production`. For a local production-build check:

```powershell
cd ..\frontend
npm ci
npm test
npm run build
```

Push the commit to `main` to trigger Cloudflare Pages. The included `public/_redirects` file provides SPA fallback routing.

### 3. Restrict backend CORS to Pages

After Pages returns its production URL, update the Cloud Run environment and keep all other variables unchanged:

```powershell
gcloud run services update logo-finder-api `
  --region asia-east1 `
  --update-env-vars FRONTEND_ORIGINS=https://logo-finder.pages.dev
```

If a custom domain is added later, provide both origins as a comma-separated value. Do not add a trailing slash.

Current production endpoints:

- Frontend: `https://logo-finder.pages.dev`
- Backend: `https://logo-finder-api-1082224547224.asia-east1.run.app`
- Google Cloud project: `logo-finder` (`ascooo-logo-finder-20260814`)
