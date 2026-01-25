/**
 * Offline Sync Manager - Auto-sync user data when online
 * Handles localStorage-based offline queue and server sync
 */

class OfflineSyncManager {
  constructor() {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    this.serverUrl = isLocal ? "http://localhost:3000/sync" : "/.netlify/functions/sync";
    this.isOnline = navigator.onLine;
    this.isSyncing = false;
    this.syncQueue = [];
    this.init();
  }

  init() {
    window.addEventListener("online", () => this.handleOnline());
    window.addEventListener("offline", () => this.handleOffline());
    setInterval(() => this.checkConnection(), 5000);
  }

  checkConnection() {
    const wasOnline = this.isOnline;
    this.isOnline = navigator.onLine;
    if (!wasOnline && this.isOnline) {
      console.log("✅ Connection restored!");
      this.handleOnline();
    }
  }

  handleOnline() {
    this.isOnline = true;
    console.log("📡 User is online - syncing...");
    this.showNotification("Syncing your progress...", "info");
    this.syncAll();
  }

  handleOffline() {
    this.isOnline = false;
    console.log("📵 User is offline - progress saved locally");
    this.showNotification("You're offline - progress will sync when online", "warning");
  }

  saveUserProgress(userId, activityKey, progressData) {
    const localKey = `activityProgress_${userId}`;
    localStorage.setItem(localKey, JSON.stringify(progressData));
    
    if (this.isOnline) {
      this.queueForSync(userId, progressData);
    }
  }

  queueForSync(userId, progressData) {
    this.syncQueue.push({ userId, progressData, timestamp: Date.now() });
    if (this.isOnline && !this.isSyncing) {
      this.processSyncQueue();
    }
  }

  async syncUser(userId, progressData) {
    try {
      const response = await fetch(this.serverUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          name: this.getUserName(userId),
          activities: progressData,
          totalScore: this.calculateScore(progressData),
          completedActivities: this.countCompleted(progressData),
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        console.log(`✅ Synced user: ${userId}`);
        localStorage.setItem(`lastLogin_${userId}`, new Date().toISOString());
        this.showNotification("✅ Progress synced!", "success");
        return true;
      }
      return false;
    } catch (error) {
      console.error("❌ Sync error:", error);
      this.showNotification("Sync failed - will retry", "error");
      return false;
    }
  }

  async syncAll() {
    if (this.isSyncing || !this.isOnline) return;
    
    this.isSyncing = true;
    let syncedCount = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith("activityProgress_")) {
        const userId = key.replace("activityProgress_", "");
        const progressData = JSON.parse(localStorage.getItem(key));
        const success = await this.syncUser(userId, progressData);
        if (success) syncedCount++;
      }
    }

    // Process queue
    while (this.syncQueue.length > 0) {
      const item = this.syncQueue.shift();
      const success = await this.syncUser(item.userId, item.progressData);
      if (success) syncedCount++;
    }

    this.isSyncing = false;
    if (syncedCount > 0) {
      console.log(`✅ Successfully synced ${syncedCount} users`);
    }
  }

  async processSyncQueue() {
    if (this.isSyncing || !this.isOnline) return;
    
    this.isSyncing = true;
    
    while (this.syncQueue.length > 0) {
      const item = this.syncQueue.shift();
      await this.syncUser(item.userId, item.progressData);
    }
    
    this.isSyncing = false;
  }

  getUserName(userId) {
    try {
      const settings = localStorage.getItem(`userSettings_${userId}`);
      if (settings) {
        const parsed = JSON.parse(settings);
        return parsed.name || "Player";
      }
    } catch (e) {
      console.error("Error parsing user settings:", e);
    }
    return "Player";
  }

  calculateScore(activities) {
    let score = 0;
    try {
      for (const [key, activity] of Object.entries(activities)) {
        if (activity && activity.completed) {
          const multiplier = activity.difficulty === "hard" ? 3 : activity.difficulty === "medium" ? 2 : 1;
          score += 10 * multiplier;
          if (activity.correctAnswers) score += activity.correctAnswers * 5;
        }
      }
    } catch (e) {
      console.error("Error calculating score:", e);
    }
    return score;
  }

  countCompleted(activities) {
    try {
      return Object.values(activities).filter((act) => act && act.completed).length;
    } catch (e) {
      console.error("Error counting completed:", e);
      return 0;
    }
  }

  getStatus() {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      queuedItems: this.syncQueue.length,
      status: this.isSyncing ? "syncing" : this.isOnline ? "online" : "offline"
    };
  }

  showNotification(message, type = "info") {
    try {
      const notification = document.createElement("div");
      notification.className = `sync-notification sync-notification-${type}`;
      notification.textContent = message;
      document.body.appendChild(notification);

      setTimeout(() => notification.classList.add("sync-notification-show"), 10);
      setTimeout(() => {
        notification.classList.remove("sync-notification-show");
        setTimeout(() => notification.remove(), 300);
      }, 3000);
    } catch (e) {
      console.error("Notification error:", e);
    }
  }
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  window.syncManager = new OfflineSyncManager();
  console.log("✅ Offline Sync Manager initialized");
});
