# Railway Deployment Guide

This guide helps you deploy this application to Railway and ensure admin panel changes appear on the frontend.

## Environment Variables Setup

### Backend Service (NestJS)

Railway automatically provides PostgreSQL connection variables when you add a PostgreSQL service. The application will use these variables:

**Required Variables:**
- `PGHOST_PUBLIC` - Railway provides this automatically (e.g., `your-db.proxy.rlwy.net`)
- `PGPORT` - Railway provides this automatically (usually `5432` or a custom port)
- `PGUSER` - Railway provides this automatically (usually `postgres`)
- `PGPASSWORD` - Railway provides this automatically
- `PGDATABASE` - Railway provides this automatically (usually `railway`)
- `NODE_ENV` - Set to `production`
- `PORT` - Railway sets this automatically
- `JWT_SECRET` - Generate a strong random string for JWT authentication

**Optional Variables:**
- `PGHOST` - Use this if you want to use Railway's internal connection (faster, but only works within Railway network)

### Frontend Build (Vite)

**Critical Variable:**
- `VITE_API_URL` - **MUST BE SET** to your backend service URL
  - Example: `https://your-backend-service.railway.app/api`
  - This tells the frontend where to fetch content from the backend
  - Without this, the frontend will try to use relative paths which won't work if frontend and backend are on different services

## Deployment Steps

### 1. Deploy Backend Service

1. Create a new Railway project
2. Add a PostgreSQL service (Railway will automatically provide database variables)
3. Connect your GitHub repository or deploy from source
4. Set the following environment variables in Railway:
   - `NODE_ENV=production`
   - `JWT_SECRET=<generate-a-strong-random-string>`
5. Railway will automatically detect and run the build/start commands

### 2. Configure Frontend

1. In your Railway project settings, find your backend service URL
2. Set the `VITE_API_URL` environment variable:
   - Go to your service → Variables
   - Add: `VITE_API_URL=https://your-backend-service.railway.app/api`
   - **Important:** Replace `your-backend-service` with your actual Railway service URL

### 3. Verify Database Connection

The application will automatically:
- Connect to Railway's PostgreSQL database
- Create necessary tables (synchronize is disabled in production for safety)
- Seed default content blocks

### 4. Test Admin Panel → Frontend Sync

1. Log into the admin panel
2. Make a change in the Content Editor
3. Wait up to 30 seconds (the frontend polls for updates every 30 seconds)
4. Refresh the frontend page to see changes immediately

## Troubleshooting

### Admin changes not showing on frontend

1. **Check `VITE_API_URL` is set correctly:**
   - Open browser console on frontend
   - Check for API errors
   - Verify the API URL is pointing to your backend service

2. **Verify database connection:**
   - Check Railway logs for database connection errors
   - Ensure PostgreSQL service is running
   - Verify all `PG*` environment variables are set

3. **Check CORS settings:**
   - The backend has CORS enabled for all origins
   - If issues persist, check Railway logs for CORS errors

4. **Clear browser cache:**
   - The frontend caches content in localStorage
   - Clear browser cache or localStorage to force fresh fetch

5. **Manual refresh:**
   - The frontend automatically polls every 30 seconds
   - You can also manually refresh the page to see changes immediately

### Database Connection Issues

If you see database connection errors:

1. Verify Railway PostgreSQL service is running
2. Check that all `PG*` variables are set in Railway
3. For external connections, ensure `PGHOST_PUBLIC` is set
4. For internal connections (same Railway project), you can use `PGHOST=postgres.railway.internal`

## Notes

- The frontend polls the backend every 30 seconds for content updates
- Admin changes are saved to PostgreSQL immediately
- The frontend uses localStorage as a fallback if the API is unavailable
- Database `synchronize` is disabled in production to prevent data loss

