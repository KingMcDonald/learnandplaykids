# Learn & Play Kids - Educational Game

A fun, offline-first educational game for kids with admin panel to track progress.

## Features

- **14 Educational Activities**: Spelling, math, reading, and more
- **Offline-First**: Works completely offline, syncs when online
- **Admin Panel**: View all users, their progress, and export data
- **Real-Time Sync**: Automatic data syncing to server
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Password Protected**: Secure admin access (password: `AdminGrade12`)

## How It Works

1. **Play Games**: Kids complete activities and earn points
2. **Local Storage**: Progress saves automatically to browser
3. **Auto-Sync**: When online, data syncs to server automatically
4. **Admin View**: See all users' progress from admin panel

## Quick Start

### Play Locally
```bash
# Just open in browser
open index.html
```

### Deploy to Netlify
See [DEPLOY.md](DEPLOY.md) for step-by-step instructions.

## Project Structure

```
index.html              - Main game interface
script.js              - Game logic and activities
additional.js          - Extra features
admin.js               - Admin panel functionality
sync.js                - Offline sync manager
style.css              - Styling
netlify.toml           - Netlify configuration
netlify/functions/sync.js - Backend API
```

## Admin Panel

- **Login**: Click "Admin Login", enter password: `AdminGrade12`
- **View Users**: See all registered users and their scores
- **Search**: Find users by name or ID
- **Export**: Download all user data as JSON
- **Delete**: Remove users from database
- **Refresh**: Auto-refreshes every 10 seconds

## Technologies

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Backend**: Netlify Functions (serverless)
- **Database**: In-memory (ephemeral)
- **Storage**: Browser localStorage + server sync

## Data Sync

- Game progress saves to browser storage immediately
- When online, data automatically posts to server
- Server stores all user data for admin access
- Offline mode queues data, syncs when connection returns

## Environment

- **Development**: `localhost:3000` 
- **Production**: Netlify Functions at `/.netlify/functions/sync`

Auto-detection: App detects environment and uses correct endpoints.

## Security Note

This is a demo/educational project. For production:
- Change admin password in `admin.js` line 8
- Add authentication/authorization
- Use a persistent database
- Add HTTPS/SSL

## License

Educational use only.
