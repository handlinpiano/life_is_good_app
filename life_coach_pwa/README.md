# Vedicas - Vedic Astrology Life Coach PWA

A Progressive Web App for Vedic astrology-based life coaching.

## Architecture

- **Frontend**: React + Vite, deployed on Vercel
- **Backend API**: FastAPI (Python), deployed on Railway
- **Auth**: Clerk
- **Database**: Convex

## Environment Variables

### Required for Production

Create a `.env.production` file (already exists) with:

```env
VITE_API_URL=https://lifeisgoodapp-production.up.railway.app/api
VITE_CLERK_PUBLISHABLE_KEY=pk_test_Y2F1c2FsLWFsaWVuLTIyLmNsZXJrLmFjY291bnRzLmRldiQ
VITE_CONVEX_URL=https://honorable-dog-90.convex.cloud
```

### For Local Development

Create a `.env` file with:

```env
VITE_API_URL=http://127.0.0.1:8000/api
VITE_CLERK_PUBLISHABLE_KEY=pk_test_Y2F1c2FsLWFsaWVuLTIyLmNsZXJrLmFjY291bnRzLmRldiQ
VITE_CONVEX_URL=https://honorable-dog-90.convex.cloud
```

## Deployment

### Frontend (Vercel)

The frontend auto-deploys from git, but the `.env.production` file ensures the correct API URL is used.

To manually deploy:

```bash
cd life_coach_pwa
vercel --prod --force
```

The `--force` flag ensures a fresh build without cache.

### Backend (Railway)

The backend auto-deploys when you push to the `master` branch:

```bash
git push origin master
```

Railway URL: `https://lifeisgoodapp-production.up.railway.app`

## Local Development

1. Start the backend:
   ```bash
   cd vedic_astrology/backend
   python main.py
   ```

2. Start the frontend:
   ```bash
   cd life_coach_pwa
   npm run dev
   ```

## Troubleshooting

### API calls fail on mobile but work on desktop

This usually means the production build has the wrong API URL baked in. Check:

1. Verify `.env.production` has the correct `VITE_API_URL`
2. Redeploy with `vercel --prod --force`
3. Clear browser cache / PWA cache on mobile

### CORS errors

The backend CORS is configured to allow all origins:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Note: `allow_credentials=False` is required when using `"*"` for origins.
