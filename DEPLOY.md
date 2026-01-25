# Deploy to Netlify - Quick Start

## Prerequisites
- GitHub account
- Netlify account (free)
- Your project files ready

## Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/learnandplaykids.git
git branch -M main
git push -u origin main
```

## Step 2: Connect to Netlify
1. Go to [netlify.com](https://netlify.com)
2. Click **"New site from Git"**
3. Choose GitHub
4. Select your `learnandplaykids` repository
5. Click **Deploy**

Done! Your app is live.

## Testing
- **Local**: Open `index.html` in browser
- **Admin Panel**: Click "Admin Login", password: `AdminGrade12`
- **Sync**: Data auto-syncs to server when online
- **Offline**: App works offline, syncs when connection returns

## What Happens
- **Game data** saves to browser storage
- **Server** stores all user progress
- **Admin panel** shows all users from server
- **Offline mode** queues data, auto-syncs when online

## Troubleshooting
- **Admin shows no users?** Click "Refresh" or check server status indicator
- **Data not syncing?** Check browser DevTools Console for errors
- **Can't login?** Password is `AdminGrade12`
- **Offline mode?** Works fine - data syncs automatically when online

Done!
