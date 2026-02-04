/**
 * Admin Panel - Supabase Cloud Sync, Multi-Device, Modern UI with Analytics
 * Loads data from all devices via Supabase, displays progress charts, real-time stats
 */

class AdminPanel {
  constructor() {
    this.users = [];
    this.stats = {};
    this.isAuthenticated = false;
    this.adminPassword = "AdminGrade12";
    this.autoRefreshInterval = null;
    this.sessionTimeout = 15 * 60 * 1000;
    this.inactivityTimer = null;
    this.titleClickCount = 0;
    this.clickTimeout = null;
    this.chartInstance = null;
    this.init();
  }

  init() {
    this.setupEventListeners();
    console.log("✅ Admin panel initialized - click score 5x to access");
    console.log("☁️ Using Supabase for multi-device sync");
  }

  setupEventListeners() {
    const titleElement = document.getElementById("appTitle");
    if (titleElement) {
      titleElement.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.handleAdminClick();
      });
    }
    document.getElementById("adminLoginBtn")?.addEventListener("click", () => this.showLoginModal());
    document.getElementById("adminLogoutBtn")?.addEventListener("click", () => this.logout());
    document.getElementById("adminAuthBtn")?.addEventListener("click", () => this.authenticate());
    document.getElementById("adminRefreshBtn")?.addEventListener("click", () => this.loadUsers());
    document.getElementById("adminSearchInput")?.addEventListener("input", (e) => this.filterUsers(e.target.value));
    document.getElementById("adminExportBtn")?.addEventListener("click", () => this.exportUsersData());
    document.getElementById("adminExportCSVBtn")?.addEventListener("click", () => this.exportCSV());
    document.getElementById("adminClearBtn")?.addEventListener("click", () => this.confirmClearAllData());
    document.getElementById("adminSyncBtn")?.addEventListener("click", () => this.syncAllDevices());
    
    const modal = document.getElementById("adminAuthModal");
    if (modal) modal.addEventListener("click", (e) => { if (e.target === modal) this.closeLoginModal(); });
    
    const passwordInput = document.getElementById("adminPassword");
    if (passwordInput) passwordInput.addEventListener("keypress", (e) => { if (e.key === "Enter") this.authenticate(); });
  }

  handleAdminClick() {
    this.titleClickCount++;
    console.log(`🔓 Admin clicks: ${this.titleClickCount}/5`);
    
    if (this.clickTimeout) clearTimeout(this.clickTimeout);
    
    if (this.titleClickCount >= 5) {
      console.log("✅ Admin access granted!");
      const adminBtn = document.getElementById("adminLoginBtn");
      if (adminBtn) {
        adminBtn.classList.remove("hidden");
        adminBtn.style.display = "block";
      }
      this.titleClickCount = 0;
    } else {
      this.clickTimeout = setTimeout(() => {
        this.titleClickCount = 0;
      }, 5000);
    }
  }

  showLoginModal() {
    const modal = document.getElementById("adminAuthModal");
    if (modal) {
      modal.style.display = "flex";
      const passwordInput = document.getElementById("adminPassword");
      if (passwordInput) {
        passwordInput.focus();
        passwordInput.value = "";
      }
    }
  }

  closeLoginModal() {
    const modal = document.getElementById("adminAuthModal");
    if (modal) modal.style.display = "none";
    const passwordInput = document.getElementById("adminPassword");
    if (passwordInput) passwordInput.value = "";
  }

  authenticate() {
    const password = document.getElementById("adminPassword")?.value || "";
    if (!password || password.trim() === "") {
      this.notify("Please enter a password", "error");
      return;
    }
    if (password === this.adminPassword) {
      this.isAuthenticated = true;
      this.closeLoginModal();
      
      const adminPanel = document.getElementById("adminPanel");
      const adminLoginBtn = document.getElementById("adminLoginBtn");
      const adminLogoutBtn = document.getElementById("adminLogoutBtn");
      
      if (adminPanel) {
        adminPanel.classList.remove("hidden");
        adminPanel.style.display = "block";
      }
      if (adminLoginBtn) {
        adminLoginBtn.style.display = "none";
      }
      if (adminLogoutBtn) {
        adminLogoutBtn.style.display = "block";
      }
      
      this.startAutoRefresh();
      this.startSessionTimeout();
      this.loadUsers();
      this.notify("✅ Admin panel loaded!", "success");
    } else {
      this.notify("❌ Wrong password", "error");
      const pwd = document.getElementById("adminPassword");
      if (pwd) pwd.value = "";
    }
  }

  logout() {
    if (confirm("Are you sure you want to logout?")) {
      this.isAuthenticated = false;
      
      const adminPanel = document.getElementById("adminPanel");
      const adminLoginBtn = document.getElementById("adminLoginBtn");
      const adminLogoutBtn = document.getElementById("adminLogoutBtn");
      
      if (adminPanel) adminPanel.style.display = "none";
      if (adminLoginBtn) adminLoginBtn.style.display = "none";
      if (adminLogoutBtn) adminLogoutBtn.style.display = "none";
      
      this.stopAutoRefresh();
      this.stopSessionTimeout();
      this.titleClickCount = 0;
      this.notify("Logged out", "info");
    }
  }

  startSessionTimeout() {
    this.resetInactivityTimer();
    window.addEventListener("mousemove", () => this.resetInactivityTimer());
    window.addEventListener("keypress", () => this.resetInactivityTimer());
    window.addEventListener("click", () => this.resetInactivityTimer());
  }

  stopSessionTimeout() {
    if (this.inactivityTimer) clearTimeout(this.inactivityTimer);
  }

  resetInactivityTimer() {
    if (!this.isAuthenticated) return;
    if (this.inactivityTimer) clearTimeout(this.inactivityTimer);
    this.inactivityTimer = setTimeout(() => {
      this.notify("⏰ Session expired. Auto-logged out.", "warning");
      this.logout();
    }, this.sessionTimeout);
  }

  async loadUsers() {
    if (!this.isAuthenticated) return;
    
    this.showLoader(true);
    try {
      // Load from Supabase
      this.users = await CloudSyncManager.getAllUsers() || [];
      this.stats = await CloudSyncManager.getUserStats() || {};
      
      if (this.users.length > 0) {
        console.log("☁️ Loaded from Supabase:", this.users.length, "users");
        this.notify(`☁️ Synced: ${this.users.length} users from all devices`, "success");
      } else {
        // Fallback to local data
        this.loadFromLocalStorage();
        this.notify("⚠️ Using local device data (no cloud data yet)", "warning");
      }
    } catch (error) {
      console.error("Load error:", error);
      // Fallback to local
      this.loadFromLocalStorage();
      this.notify("Using cached local data", "error");
    } finally {
      this.showLoader(false);
      this.renderDashboard();
      this.renderTable();
    }
  }

  loadFromLocalStorage() {
    this.users = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("activityProgress_")) {
        const userId = key.replace("activityProgress_", "");
        try {
          const progressData = JSON.parse(localStorage.getItem(key)) || {};
          const settingsStr = localStorage.getItem(`userSettings_${userId}`) || '{"name":"Unknown"}';
          const settings = JSON.parse(settingsStr);
          const gameKeyStr = localStorage.getItem(`kg_${userId}`) || '{}';
          let gameStats = {};
          try {
            gameStats = JSON.parse(gameKeyStr);
          } catch (e) {
            console.warn(`Could not parse game data for ${userId}`);
          }
          
          const activities = Object.values(progressData).filter(a => a && a.completed).length;
          const score = progressData.score || 0;
          const lastLogin = localStorage.getItem(`lastLogin_${userId}`);
          const accuracy = gameStats.stats?.accuracy || null;
          
          this.users.push({
            userId,
            name: settings.name || "Unknown Player",
            activities: progressData.sessionCount || activities,
            totalScore: score,
            accuracy: accuracy,
            syncStatus: "local",
            timestamp: new Date().toISOString(),
            lastLogin,
            plantStage: progressData.plantStage || 0
          });
        } catch (err) {
          console.error(`Error parsing user data for ${userId}:`, err);
        }
      }
    }
    
    // Calculate stats
    if (this.users.length > 0) {
      this.stats = {
        totalUsers: this.users.length,
        totalScore: this.users.reduce((sum, u) => sum + (u.totalScore || 0), 0),
        avgScore: (this.users.reduce((sum, u) => sum + (u.totalScore || 0), 0) / this.users.length).toFixed(1),
        avgAccuracy: (this.users.reduce((sum, u) => sum + (u.accuracy || 0), 0) / this.users.length).toFixed(1),
        activeUsers: this.users.length
      };
    }
  }

  renderDashboard() {
    const statsContainer = document.getElementById("adminStats");
    if (!statsContainer) return;
    
    const stats = this.stats || {};
    statsContainer.innerHTML = `
      <div class="admin-stats-grid">
        <div class="admin-stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-value">${stats.totalUsers || this.users.length}</div>
          <div class="stat-label">Total Kids</div>
        </div>
        <div class="admin-stat-card">
          <div class="stat-icon">⭐</div>
          <div class="stat-value">${stats.totalScore || 0}</div>
          <div class="stat-label">Total Points</div>
        </div>
        <div class="admin-stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-value">${stats.avgScore || 0}</div>
          <div class="stat-label">Avg Score</div>
        </div>
        <div class="admin-stat-card">
          <div class="stat-icon">🎯</div>
          <div class="stat-value">${stats.avgAccuracy || 0}%</div>
          <div class="stat-label">Avg Accuracy</div>
        </div>
      </div>
      <div id="adminChartContainer" class="admin-chart-container"></div>
    `;
    
    // Draw chart
    this.drawProgressChart();
  }

  drawProgressChart() {
    const container = document.getElementById("adminChartContainer");
    if (!container || this.users.length === 0) return;
    
    // Sort users by score
    const topUsers = [...this.users]
      .sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))
      .slice(0, 10);
    
    const canvas = document.createElement("canvas");
    canvas.id = "progressChart";
    canvas.style.maxWidth = "100%";
    canvas.style.height = "300px";
    container.innerHTML = "";
    container.appendChild(canvas);
    
    // Simple bar chart using canvas
    const ctx = canvas.getContext("2d");
    const width = canvas.parentElement.offsetWidth;
    const height = 300;
    canvas.width = width;
    canvas.height = height;
    
    const barWidth = width / (topUsers.length + 2);
    const maxScore = Math.max(...topUsers.map(u => u.totalScore || 0), 10);
    const padding = 40;
    
    // Draw background
    ctx.fillStyle = "#f8f9fa";
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid lines
    ctx.strokeStyle = "#e0e0e0";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = height - padding - (i / 5) * (height - padding * 1.5);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
      
      // Labels
      ctx.fillStyle = "#999";
      ctx.font = "12px Arial";
      ctx.textAlign = "right";
      ctx.fillText((i / 5 * maxScore).toFixed(0), 35, y + 4);
    }
    
    // Draw bars
    topUsers.forEach((user, idx) => {
      const x = padding + idx * barWidth + barWidth / 4;
      const barHeight = ((user.totalScore || 0) / maxScore) * (height - padding * 1.5);
      
      // Bar
      ctx.fillStyle = `hsl(${200 + idx * 20}, 70%, 60%)`;
      ctx.fillRect(x, height - padding - barHeight, barWidth / 2, barHeight);
      
      // Name label
      ctx.fillStyle = "#333";
      ctx.font = "12px Arial";
      ctx.textAlign = "center";
      ctx.save();
      ctx.translate(x + barWidth / 4, height - 10);
      ctx.rotate(-Math.PI / 4);
      ctx.fillText((user.name || "Unknown").substring(0, 8), 0, 0);
      ctx.restore();
      
      // Score label on bar
      ctx.fillStyle = "white";
      ctx.font = "bold 12px Arial";
      ctx.textAlign = "center";
      ctx.fillText(user.totalScore || 0, x + barWidth / 4, height - padding - barHeight + 15);
    });
    
    // Draw axes
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, padding);
    ctx.lineTo(40, height - padding);
    ctx.lineTo(width, height - padding);
    ctx.stroke();
    
    // Axis labels
    ctx.fillStyle = "#666";
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Top 10 Players", width / 2, 20);
  }

  renderTable() {
    const tbody = document.getElementById("adminUsersTableBody");
    if (!tbody) return;
    
    if (this.users.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" style="text-align: center; padding: 40px; color: #666;">
            <p style="font-size: 16px; margin: 10px 0;">📭 No users yet</p>
            <p style="font-size: 14px; color: #999;">Kids need to play at least one activity to appear here</p>
          </td>
        </tr>
      `;
      return;
    }
    
    tbody.innerHTML = this.users.map((user, idx) => {
      const lastLogin = user.lastLogin ? this.timeAgo(user.lastLogin) : "Never";
      const syncBadge = user.syncStatus === "synced" ? "☁️ Cloud" : "📱 Local";
      
      return `
        <tr style="border-bottom: 1px solid #eee; hover: background: #f5f5f5;">
          <td style="padding: 12px;">${idx + 1}</td>
          <td style="padding: 12px; font-weight: 500;">${user.name || "Unknown"}</td>
          <td style="padding: 12px;">${user.activities || 0}</td>
          <td style="padding: 12px;"><strong>${user.totalScore || 0}</strong> pts</td>
          <td style="padding: 12px; text-align: center;">
            <span style="background: ${user.accuracy > 70 ? '#10b981' : user.accuracy > 50 ? '#f59e0b' : '#ef4444'}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
              ${user.accuracy ? user.accuracy.toFixed(1) : 'N/A'}%
            </span>
          </td>
          <td style="padding: 12px;">${lastLogin}</td>
          <td style="padding: 12px; text-align: center;">${syncBadge}</td>
          <td style="padding: 12px; font-size: 12px; color: #666;">
            Stage ${user.plantStage || 0}
          </td>
          <td style="padding: 12px; white-space: nowrap;">
            <button onclick="window.adminPanel?.viewUserDetails('${user.userId}')" style="background: #3b82f6; color: white; padding: 6px 10px; border: none; border-radius: 4px; cursor: pointer; font-size: 11px; margin-right: 4px;">📊 View</button>
            <button onclick="window.adminPanel?.deleteUser('${user.userId}')" style="background: #ef4444; color: white; padding: 6px 10px; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">🗑️ Delete</button>
          </td>
        </tr>
      `;
    }).join("");
  }

  filterUsers(term) {
    if (!term.trim()) {
      this.renderTable();
      return;
    }
    
    const filtered = this.users.filter(u => 
      (u.name && u.name.toLowerCase().includes(term.toLowerCase())) || 
      (u.userId && u.userId.toLowerCase().includes(term.toLowerCase()))
    );
    
    const tbody = document.getElementById("adminUsersTableBody");
    if (!tbody) return;
    
    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 20px; color: #999;">No matches found</td></tr>';
      return;
    }
    
    tbody.innerHTML = filtered.map((user, idx) => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 12px;">${idx + 1}</td>
        <td style="padding: 12px;">${user.name || "Unknown"}</td>
        <td style="padding: 12px;">${user.activities || 0}</td>
        <td style="padding: 12px;"><strong>${user.totalScore || 0}</strong> pts</td>
        <td style="padding: 12px;">${user.accuracy ? user.accuracy.toFixed(1) : 'N/A'}%</td>
        <td style="padding: 12px;">${this.timeAgo(user.lastLogin || user.timestamp)}</td>
        <td style="padding: 12px;">${user.syncStatus === "synced" ? "☁️ Cloud" : "📱 Local"}</td>
        <td style="padding: 12px;">Stage ${user.plantStage || 0}</td>
        <td style="padding: 12px;">
          <button onclick="window.adminPanel?.viewUserDetails('${user.userId}')" style="background: #3b82f6; color: white; padding: 6px 10px; border: none; border-radius: 4px; cursor: pointer; font-size: 11px; margin-right: 4px;">View</button>
          <button onclick="window.adminPanel?.deleteUser('${user.userId}')" style="background: #ef4444; color: white; padding: 6px 10px; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">Delete</button>
        </td>
      </tr>
    `).join("");
  }

  async deleteUser(userId) {
    const user = this.users.find(u => u.userId === userId);
    if (!user) return;
    
    if (!confirm(`⚠️ Delete "${user.name}"? This will delete from ALL devices!`)) return;
    if (!confirm("Are you absolutely sure? This cannot be undone!")) return;
    
    try {
      this.showLoader(true);
      
      // Delete from Supabase (affects all devices)
      const success = await CloudSyncManager.deleteUser(userId);
      
      if (success) {
        console.log("☁️ User deleted from Supabase");
        this.notify(`✅ ${user.name} deleted from all devices`, "success");
      } else {
        this.notify("❌ Could not delete from cloud", "error");
      }
    } catch (e) {
      console.error("Delete error:", e);
      this.notify("Error deleting user", "error");
    } finally {
      // Also delete from local storage for this device
      localStorage.removeItem(`activityProgress_${userId}`);
      localStorage.removeItem(`userSettings_${userId}`);
      localStorage.removeItem(`kg_${userId}`);
      localStorage.removeItem(`lastLogin_${userId}`);
    }
    
    this.users = this.users.filter(u => u.userId !== userId);
    this.renderTable();
    this.renderDashboard();
    this.notify(`✅ ${user.name} deleted from all devices`, "success");
  }

  viewUserDetails(userId) {
    const user = this.users.find(u => u.userId === userId);
    if (!user) return;
    
    const message = `
👤 ${user.name}
⭐ Score: ${user.totalScore} points
📊 Accuracy: ${user.accuracy ? user.accuracy.toFixed(1) : 'N/A'}%
🎯 Activities: ${user.activities}
📱 Device: ${user.syncStatus === 'synced' ? 'Cloud' : 'Local'}
🌱 Plant Stage: ${user.plantStage}
⏰ Last Login: ${this.timeAgo(user.lastLogin || user.timestamp)}
    `;
    alert(message);
  }

  async syncAllDevices() {
    if (!confirm("Sync all local data to Supabase?")) return;
    
    this.showLoader(true);
    try {
      let syncedCount = 0;
      for (const user of this.users) {
        // Get full data from local storage if available
        const userId = user.userId;
        const gameData = localStorage.getItem(`kg_${userId}`);
        
        if (gameData) {
          const data = JSON.parse(gameData);
          const success = await CloudSyncManager.saveUser(userId, user.name, data);
          if (success) syncedCount++;
        }
      }
      this.notify(`✅ ${syncedCount} users synced to Supabase!`, "success");
      await this.loadUsers();
    } catch (error) {
      console.error("Sync error:", error);
      this.notify("❌ Sync failed", "error");
    } finally {
      this.showLoader(false);
    }
  }

  exportUsersData() {
    const json = JSON.stringify(this.users, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    this.notify("✅ JSON exported", "success");
  }

  exportCSV() {
    if (this.users.length === 0) {
      this.notify("❌ No users to export", "warning");
      return;
    }

    const headers = ["Name", "Score", "Accuracy %", "Activities", "Last Login", "Device Type", "Plant Stage"];
    const rows = this.users.map(u => [
      `"${u.name}"`,
      u.totalScore || 0,
      u.accuracy ? u.accuracy.toFixed(1) : "N/A",
      u.activities || 0,
      u.lastLogin || "Never",
      u.syncStatus === "synced" ? "Cloud" : "Local",
      u.plantStage || 0
    ]);

    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    this.notify("✅ CSV exported", "success");
  }

  confirmClearAllData() {
    if (!confirm("⚠️ Delete ALL user data from this device?")) return;
    if (!confirm("Are you ABSOLUTELY sure? Type DELETE to confirm:")) return;
    
    const response = prompt("Type 'DELETE ALL' to permanently delete all data:");
    if (response === "DELETE ALL") {
      this.clearAllData();
    } else {
      this.notify("❌ Cancelled", "info");
    }
  }

  clearAllData() {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith("activityProgress_") || key.startsWith("userSettings_") || key.startsWith("kg_"))) {
        keys.push(key);
      }
    }
    keys.forEach(key => localStorage.removeItem(key));
    this.users = [];
    this.renderTable();
    this.renderDashboard();
    this.notify("✅ All local data cleared", "success");
  }

  showLoader(show = true) {
    let loader = document.getElementById("adminLoader");
    if (!loader && show) {
      loader = document.createElement("div");
      loader.id = "adminLoader";
      loader.className = "loader-overlay active";
      loader.innerHTML = '<div class="loader-content"><div class="loader"></div><p>Loading...</p></div>';
      document.body.appendChild(loader);
    } else if (loader) {
      loader.classList.toggle("active", show);
    }
  }

  startAutoRefresh() {
    if (this.autoRefreshInterval) return;
    this.autoRefreshInterval = setInterval(() => {
      if (this.isAuthenticated && document.getElementById("adminPanel")?.style.display === "block") {
        this.loadUsers();
      }
    }, 30000);
  }

  stopAutoRefresh() {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
      this.autoRefreshInterval = null;
    }
  }

  timeAgo(timestamp) {
    if (!timestamp) return "Never";
    const date = new Date(timestamp);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  notify(msg, type = "info") {
    const el = document.createElement("div");
    el.className = `fixed top-4 right-4 px-4 py-2 rounded text-white admin-toast admin-toast-${type}`;
    el.textContent = msg;
    el.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 6px;
      color: white;
      font-size: 14px;
      z-index: 9999;
      animation: slideIn 0.3s ease-out;
      background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
    `;
    document.body.appendChild(el);
    setTimeout(() => {
      el.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => el.remove(), 300);
    }, 3000);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.adminPanel = new AdminPanel();
});
