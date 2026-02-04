# Learn & Play Kids - Educational Gaming Platform

An interactive, offline-first educational gaming platform designed for children. Kids complete learning activities, earn points, and grow a virtual plant as they progress. Built with vanilla JavaScript and Supabase for real-time cloud synchronization.

## 🎯 Features

### 🎮 Core Gaming
- **Interactive Learning Activities**: Educational games for math, spelling, and cognitive skills
- **Virtual Plant Growth System**: Visual progress representation that grows with achievements
- **Score & Streak System**: Rewards consistent engagement with daily streaks and accumulated scores
- **Admin Dashboard**: Teachers/parents can monitor progress and manage student accounts

### 🌐 Offline-First Architecture
- **Service Worker**: Full offline functionality with automatic sync
- **Local Storage**: Data persisted locally with Supabase cloud backup
- **Auto-Sync**: Automatic synchronization when connection is restored
- **Multi-Device Support**: Real-time synchronization across devices

### 📱 Progressive Web App
- **Installable**: Install on mobile and desktop devices
- **Responsive Design**: Works seamlessly on phones, tablets, and computers
- **App-Like Experience**: Standalone display mode without browser UI
- **Smart Caching**: Network-first strategy with offline fallback

### 🔒 Security
- **Row Level Security**: Supabase RLS policies protect user data
- **Secure API Integration**: Safe Supabase REST API communication
- **Session Analytics**: Detailed gameplay tracking for research

## 🛠️ Tech Stack

### Frontend
- **HTML5**: Semantic markup with PWA capabilities
- **CSS3**: Responsive styling with animations
- **Vanilla JavaScript**: No framework dependencies for lightweight performance
- **Service Worker**: Offline support and caching strategy

### Backend
- **Supabase**: PostgreSQL database with REST API
  - User profiles and statistics
  - Session tracking and analytics
  - Activity progress monitoring
  - Real-time data synchronization

### Deployment
- **Netlify**: Hosting with serverless functions
- **Netlify Functions**: Backend logic for sync operations

## 📁 Project Structure

```
├── index.html                 # Main application entry point
├── script.js                  # Core game logic and UI
├── admin.js                   # Admin dashboard functionality
├── supabase.js                # Supabase integration and API
├── additional.js              # Additional utility functions
├── sync.js                    # Offline sync manager
├── service-worker.js          # Service Worker for offline support
├── style.css                  # Application styling
├── manifest.json              # PWA manifest
├── netlify.toml              # Netlify configuration
├── SUPABASE_SETUP.md         # Database setup guide
├── SUPABASE_SETUP.sql        # SQL initialization scripts
├── APP_DESCRIPTION.md        # Detailed feature description
├── assets/                    # Images and app assets
├── netlify/functions/        # Serverless functions
│   └── sync.js              # Sync operation handler
```

## 🚀 Getting Started

### Prerequisites
- Web browser with JavaScript enabled
- Supabase account (for cloud features)
- Node.js and npm (for development/deployment)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd "Vanilla - JS"
   ```

2. **Configure Supabase** (Optional - for cloud sync)
   - Follow the [SUPABASE_SETUP.md](SUPABASE_SETUP.md) guide
   - Create environment configuration

3. **Start a local server**
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Or using Node.js http-server
   npx http-server
   ```

4. **Open in browser**
   - Navigate to `http://localhost:8000`
   - The app will work offline after first visit due to Service Worker

### Deployment to Netlify

1. **Connect your repository** to Netlify
2. **Set environment variables**
   - Add Supabase API keys in Netlify settings
3. **Deploy**
   - Push to main branch or deploy manually via Netlify dashboard

## 📖 Usage

### For Students
1. Open the app in your browser
2. Complete educational activities
3. Earn points and watch your plant grow
4. Maintain your streak for bonuses
5. Progress syncs automatically across devices

### For Teachers/Parents
1. Access the admin dashboard
2. Monitor student progress and statistics
3. View learning curves and performance analytics
4. Manage student accounts and settings

## 🔧 Configuration

### Supabase Setup
See [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for detailed instructions on:
- Database initialization
- Row Level Security policies
- API key configuration
- Real-time subscriptions

### Service Worker
The Service Worker is automatically registered in `script.js`. It:
- Caches app assets on first visit
- Enables offline functionality
- Syncs data when connection is restored

## 🔄 Offline Sync Strategy

The app uses an intelligent sync system (`sync.js`):
- **Local Changes**: Stored in localStorage
- **Conflict Resolution**: Server data takes precedence on conflicts
- **Auto-Sync**: Attempts sync when online
- **User Notifications**: Clear feedback on sync status

## 📊 Analytics

The app tracks:
- User engagement and session duration
- Learning activity completion
- Performance trends
- Streak maintenance
- Custom milestones

Data is securely stored in Supabase and accessible via admin dashboard.

## 🐛 Troubleshooting

### App Not Working Offline
- Check Service Worker registration in browser DevTools
- Ensure app was visited at least once online
- Check browser's offline storage permissions

### Sync Issues
- Verify Supabase connection credentials
- Check browser console for error messages
- Ensure API keys have correct permissions

### Installation Issues
- Open DevTools → Application tab
- Check manifest.json is loading correctly
- Verify SSL certificate (required for HTTPS)

## 📚 Additional Resources

- [APP_DESCRIPTION.md](APP_DESCRIPTION.md) - Detailed feature overview
- [SUPABASE_SETUP.md](SUPABASE_SETUP.md) - Backend configuration
- [SUPABASE_SETUP.sql](SUPABASE_SETUP.sql) - Database schema

## 📄 License

This project is created for educational purposes.

## 👥 Contributing

Contributions are welcome! Please ensure:
- Code follows the existing style
- Service Worker changes are tested
- Offline functionality is verified
- Browser compatibility is maintained

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review console error messages
3. Refer to detailed documentation in supporting markdown files

---

**Happy Learning! 🌱**
