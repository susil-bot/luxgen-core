# API Deployment Instructions

## Quick Deploy Options

### 1. Render (Recommended - Free Tier)
1. Push code to GitHub
2. Go to [render.com](https://render.com)
3. Connect your GitHub repository
4. Create new Web Service
5. Set environment variables in dashboard
6. Deploy!

### 2. Railway
1. Push code to GitHub
2. Go to [railway.app](https://railway.app)
3. Connect your GitHub repository
4. Set environment variables
5. Deploy!

### 3. Heroku
1. Install Heroku CLI
2. Run: `heroku create your-app-name`
3. Set environment variables: `heroku config:set KEY=value`
4. Deploy: `git push heroku main`

### 4. Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow prompts
4. Set environment variables in dashboard

## Environment Variables Required

Copy from `.env.production.template` and update with your values:

- `MONGODB_URL`: Your MongoDB Atlas connection string
- `JWT_SECRET`: A strong secret key
- `CORS_ORIGIN`: Your frontend URL (e.g., http://localhost:3000 for development)

## Local Development Setup

1. Copy `.env.production.template` to `.env`
2. Update with local values
3. Run: `npm run dev`

## Frontend Configuration

Update your frontend API client to point to the deployed API:

```javascript
// In src/services/apiClient.ts
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
```

Set `REACT_APP_API_URL` in your frontend `.env` file to your deployed API URL.
