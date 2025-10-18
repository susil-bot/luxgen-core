# 🚀 Netlify Setup Instructions

## Step 1: Create Netlify Account
1. Go to: https://app.netlify.com/
2. Sign up with GitHub
3. Connect your GitHub account

## Step 2: Create New Site
1. Click "New site from Git"
2. Choose "GitHub"
3. Select repository: `susil-bot/luxgen-core`
4. Choose root directory: `luxgen-backend`

## Step 3: Configure Build Settings
- Build command: `npm run build`
- Publish directory: `dist`
- Functions directory: `netlify/functions`

## Step 4: Add Environment Variables
Go to Site settings > Environment variables and add:

```
MONGODB_URI=mongodb+srv://luxgen-prod-user:[YOUR_SECURE_PASSWORD]@luxgen-cluster.xxxxx.mongodb.net/luxgen?retryWrites=true&w=majority
NODE_ENV=production
PORT=3000
CORS_ORIGINS=https://luxgen-frontend.vercel.app,https://luxgen-multi-tenant.vercel.app
CORS_CREDENTIALS=true
JWT_SECRET=a7832a542b9d5710d9c364bc15ae2f1aa773c720e6213bb0e05bff793691f389
JWT_EXPIRES_IN=7d
API_VERSION=v1
API_PREFIX=/api
API_KEY=f3b160a95c3b34d95d055519a49cf28a
ENCRYPTION_KEY=3c62775ebb39041d8546fc9fdee60fe15933cc21436e73f27cb7639bd60d60ed
```

## Step 5: Get Netlify Secrets for GitHub
1. Go to: https://app.netlify.com/user/applications#personal-access-tokens
2. Click "New access token"
3. Name: "GitHub Actions"
4. Copy the token

5. Go to your site settings
6. Copy the Site ID

## Step 6: Add GitHub Secrets
Go to: https://github.com/susil-bot/luxgen-core/settings/secrets/actions

Add these secrets:
- `NETLIFY_AUTH_TOKEN`: [Your Netlify token]
- `NETLIFY_SITE_ID`: [Your Netlify site ID]
