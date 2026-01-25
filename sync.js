/**
 * Offline Sync - Auto-sync user data when online
 */

class OfflineSyncManager {
  constructor() {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    this.serverUrl = isLocal ? "http://localhost:3000/sync" : "/.netlify/functions/sync";
    this.isOnline = navigator.onLine;
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
    if (!wasOnline && this.isOnline) this.syncAll();
  }

  handleOnline() {
    this.isOnline = true;
    this.showNotification("Syncing your progress...", "info");
    this.syncAll();
  }

  handleOffline() {
    this.isOnline = false;
    this.showNotification("You're offline - progress saved locally", "warning");
  }

  saveUserProgress(userId, activityKey, progressData) {
    localStorage.setItem(`activityProgress_${userId}`, JSON.stringify(progressData));
    if (this.isOnline) this.syncUser(userId, progressData);
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
        console.log(`✅ Synced: ${userId}`);
        localStorage.setItem(`lastLogin_${userId}`, new Date().toISOString());
        this.showNotification("✅ Progress synced!", "success");
      }
    } catch (error) {
      console.error("Sync failed:", error);
    }
  }

  async syncAll() {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith("activityProgress_")) {
        const userId = key.replace("activityProgress_", "");
        const progressData = JSON.parse(localStorage.getItem(key));
        await this.syncUser(userId, progressData);
      }
    }
  }

  getUserName(userId) {
    const settings = localStorage.getItem(`userSettings_${userId}`);
    if (settings) {
      const parsed = JSON.parse(settings);
      return parsed.name || userId;
    }
    return userId;
  }

  calculateScore(activities) {
    let score = 0;
    for (const [key, activity] of Object.entries(activities)) {
      if (activity.completed) {
        const multiplier = activity.difficulty === "hard" ? 3 : activity.difficulty === "medium" ? 2 : 1;
        score += 10 * multiplier;
        if (activity.correctAnswers) score += activity.correctAnswers * 5;
      }
    }
    return score;
  }

  countCompleted(activities) {
    return Object.values(activities).filter((act) => act.completed).length;
  }

  showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.className = `sync-notification sync-notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add("sync-notification-show"), 10);
    setTimeout(() => {
      notification.classList.remove("sync-notification-show");
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.syncManager = new OfflineSyncManager();
});

  /**
   * Initialize offline sync system
   */
  init() {
    console.log("OfflineSyncManager initialized");
    
    // Listen for online/offline events
    window.addEventListener("online", () => this.handleOnline());
    window.addEventListener("offline", () => this.handleOffline());

    // Check connection periodically
    setInterval(() => this.checkConnection(), 5000);

    // Initial connection check
    this.checkConnection();
  }

  /**
   * Check connection status
   */
  checkConnection() {
    const wasOnline = this.isOnline;
    this.isOnline = navigator.onLine;

    if (!wasOnline && this.isOnline) {
      console.log("Connection restored!");
      this.handleOnline();
    }
  }

  /**
   * Handle when user comes online
   */
  handleOnline() {
    console.log("User is online - Starting sync...");
    this.isOnline = true;
    this.showSyncNotification("Syncing your progress...", "info");
    this.syncAllUserData();
  }

  /**
   * Handle when user goes offline
   */
  handleOffline() {
    console.log("User is offline - Data will sync when online");
    this.isOnline = false;
    this.showSyncNotification("You are offline - Your progress is being saved locally", "warning");
  }

  /**
   * Save user progress (called from main game)
   */
  saveUserProgress(userId, activityKey, progressData) {
    const localKey = `activityProgress_${userId}`;
    const serverKey = `sync_pending_${userId}_${activityKey}`;

    // Always save to localStorage first (offline-safe)
    localStorage.setItem(localKey, JSON.stringify(progressData));

    // Mark for sync if online
    if (this.isOnline) {
      this.queueForSync(userId, activityKey, progressData);
    } else {
      // Mark as pending sync when online
      localStorage.setItem(serverKey, JSON.stringify({
        userId,
        activityKey,
        data: progressData,
        timestamp: new Date().toISOString(),
        synced: false
      }));
    }
  }

  /**
   * Queue data for synchronization
   */
  queueForSync(userId, activityKey, progressData) {
    this.syncQueue.push({
      userId,
      activityKey,
      data: progressData,
      timestamp: new Date().toISOString()
    });

    // Sync immediately if online and not already syncing
    if (this.isOnline && !this.isSyncing) {
      this.processSyncQueue();
    }
  }

  /**
   * Get all pending sync items
   */
  getPendingSyncItems() {
    const pending = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith("sync_pending_")) {
        const data = JSON.parse(localStorage.getItem(key));
        if (!data.synced) {
          pending.push({ key, ...data });
        }
      }
    }

    return pending;
  }

  /**
   * Sync all user data
   */
  async syncAllUserData() {
    if (!this.isOnline) {
      console.log("Not online - skipping sync");
      return;
    }

    const users = this.getAllLocalUsers();

    for (const user of users) {
      await this.syncUserData(user.id, user);
    }

    // Also sync pending items
    const pending = this.getPendingSyncItems();
    for (const item of pending) {
      await this.syncUserData(item.userId, item.data);
    }

    this.showSyncNotification("✅ All progress synced!", "success");
  }

  /**
   * Process sync queue
   */
  async processSyncQueue() {
    if (this.isSyncing || !this.isOnline) return;

    this.isSyncing = true;

    while (this.syncQueue.length > 0) {
      const item = this.syncQueue.shift();
      await this.sendToServer(item);
    }

    this.isSyncing = false;
  }

  /**
   * Sync specific user data
   */
  async syncUserData(userId, userData) {
    try {
      const payload = {
        userId,
        name: this.getUserName(userId),
        activities: userData.activities || userData,
        totalScore: this.calculateScore(userData),
        completedActivities: this.countCompleted(userData),
        timestamp: new Date().toISOString()
      };

      await this.sendToServer(payload);

      // Mark pending items as synced
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.includes(`sync_pending_${userId}`)) {
          const item = JSON.parse(localStorage.getItem(key));
          item.synced = true;
          localStorage.setItem(key, JSON.stringify(item));
        }
      }

      console.log(`Synced user: ${userId}`);
    } catch (error) {
      console.error("Sync error:", error);
      // Keep in queue for retry
    }
  }

  /**
   * Send data to server
   */
  async sendToServer(payload) {
    try {
      const response = await fetch(this.serverUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      console.log("Data synced successfully", payload);
      return true;
    } catch (error) {
      console.error("Failed to sync:", error);
      return false;
    }
  }

  /**
   * Get all local users
   */
  getAllLocalUsers() {
    const users = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);

      if (key.startsWith("activityProgress_")) {
        const userId = key.replace("activityProgress_", "");
        const progressData = JSON.parse(localStorage.getItem(key));

        users.push({
          id: userId,
          activities: progressData
        });
      }
    }

    return users;
  }

  /**
   * Get user name from settings
   */
  getUserName(userId) {
    const settings = localStorage.getItem(`userSettings_${userId}`);
    if (settings) {
      const parsed = JSON.parse(settings);
      return parsed.name || userId;
    }
    return userId;
  }

  /**
   * Calculate user score
   */
  calculateScore(data) {
    let score = 0;

    if (data.activities) {
      for (const [key, activity] of Object.entries(data.activities)) {
        if (activity.completed) {
          const multiplier = activity.difficulty === "hard" ? 3 : activity.difficulty === "medium" ? 2 : 1;
          score += 10 * multiplier;
          if (activity.correctAnswers) {
            score += activity.correctAnswers * 5;
          }
        }
      }
    }

    return score;
  }

  /**
   * Count completed activities
   */
  countCompleted(data) {
    let count = 0;

    if (data.activities) {
      Object.values(data.activities).forEach((activity) => {
        if (activity.completed) count++;
      });
    }

    return count;
  }

  /**
   * Show sync notification
   */
  showSyncNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.className = `sync-notification sync-notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add("sync-notification-show");
    }, 10);

    setTimeout(() => {
      notification.classList.remove("sync-notification-show");
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  /**
   * Manual sync trigger
   */
  async manualSync() {
    console.log("Manual sync initiated");
    if (!this.isOnline) {
      this.showSyncNotification("No internet connection", "error");
      return false;
    }

    this.showSyncNotification("Syncing...", "info");
    await this.syncAllUserData();
    return true;
  }

  /**
   * Get sync status
   */
  getStatus() {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      queuedItems: this.syncQueue.length,
      pendingItems: this.getPendingSyncItems().length
    };
  }
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  window.syncManager = new OfflineSyncManager();
});
