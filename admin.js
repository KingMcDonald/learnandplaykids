/**
 * Admin Panel - Enhanced with session timeout, validations, and security
 */

class AdminPanel {
  constructor() {
    this.users = [];
    this.isAuthenticated = false;
    this.adminPassword = "AdminGrade12"; // Hardcoded password for browser
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    this.apiEndpoint = isLocal ? "http://localhost:3000/sync" : "/.netlify/functions/sync";
    this.autoRefreshInterval = null;
    this.sessionTimeout = 15 * 60 * 1000; // 15 minutes
    this.inactivityTimer = null;
    this.titleClickCount = 0;
    this.clickTimeout = null;
    this.init();
  }

  init() {
    this.setupEventListeners();
    // Only load users if authenticated, otherwise wait for login
    if (this.isAuthenticated) {
      this.loadUsers();
      this.startAutoRefresh();
    } else {
      console.log("✅ Admin panel ready - click score 5x to login");
    }
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
      // Show the admin button instead of modal directly
      const adminBtn = document.getElementById("adminLoginBtn");
      if (adminBtn) {
        adminBtn.classList.remove("hidden");
        adminBtn.style.display = "block";
        console.log("🔧 Admin button is now visible!");
      }
      this.titleClickCount = 0;
    } else {
      this.clickTimeout = setTimeout(() => {
        console.log("⏰ Click counter reset");
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
    if (modal) {
      modal.style.display = "none";
    }
    const passwordInput = document.getElementById("adminPassword");
    if (passwordInput) {
      passwordInput.value = "";
    }
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
      
      // Show admin panel and hide login button
      const adminPanel = document.getElementById("adminPanel");
      const adminLoginBtn = document.getElementById("adminLoginBtn");
      const adminLogoutBtn = document.getElementById("adminLogoutBtn");
      
      if (adminPanel) {
        adminPanel.classList.remove("hidden");
        adminPanel.style.display = "block";
      }
      if (adminLoginBtn) {
        adminLoginBtn.classList.add("hidden");
        adminLoginBtn.style.display = "none";
      }
      if (adminLogoutBtn) {
        adminLogoutBtn.classList.remove("hidden");
        adminLogoutBtn.style.display = "block";
      }
      
      this.startAutoRefresh();
      this.startSessionTimeout();
      this.loadUsers(); // Load once on login
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
      
      if (adminPanel) {
        adminPanel.classList.add("hidden");
        adminPanel.style.display = "none";
      }
      if (adminLoginBtn) {
        adminLoginBtn.classList.remove("hidden");
        adminLoginBtn.style.display = "none"; // Keep hidden until 5 clicks again
      }
      if (adminLogoutBtn) {
        adminLogoutBtn.classList.add("hidden");
        adminLogoutBtn.style.display = "none";
      }
      
      this.stopAutoRefresh();
      this.stopSessionTimeout();
      this.titleClickCount = 0; // Reset click counter
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
    if (!this.isAuthenticated) return; // Don't load if not authenticated
    
    this.showLoader(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // Increased to 10 seconds
      
      const response = await fetch(`${this.apiEndpoint}?action=getAllUsers`, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        this.users = Array.isArray(data.users) ? data.users : [];
        this.renderTable();
        this.notify("✅ Users loaded", "success");
      } else {
        this.loadFromLocalStorage();
        this.renderTable();
        this.notify("⚠️ Using local data", "warning");
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn("⏱️ Request timeout - using local data");
      } else {
        console.error("Load error:", error);
      }
      this.loadFromLocalStorage();
      this.renderTable();
      this.notify("❌ Using cached data", "error");
    } finally {
      this.showLoader(false);
    }
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

  loadFromLocalStorage() {
    this.users = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith("activityProgress_")) {
        const userId = key.replace("activityProgress_", "");
        const progressData = JSON.parse(localStorage.getItem(key));
        const settings = JSON.parse(localStorage.getItem(`userSettings_${userId}`) || '{"name":"Unknown"}');
        const activities = Object.values(progressData || {}).filter(a => a.completed).length;
        const score = Object.values(progressData || {}).reduce((s, a) => s + (a.score || 0), 0);
        const lastLogin = localStorage.getItem(`lastLogin_${userId}`) || null;
        this.users.push({
          userId, name: settings.name || userId, activities, score, syncStatus: "local", timestamp: new Date().toISOString(), lastLogin
        });
      }
    }
  }

  renderTable() {
    const tbody = document.getElementById("adminUsersTableBody");
    if (!tbody) {
      console.warn("⚠️ Admin users table body not found");
      return;
    }
    
    if (this.users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4">No users found</td></tr>';
      return;
    }
    
    tbody.innerHTML = this.users.map((user, idx) => `
      <tr class="border-b hover:bg-gray-50">
        <td class="px-4 py-2">${idx + 1}</td>
        <td class="px-4 py-2">${user.name || "Unknown"}</td>
        <td class="px-4 py-2">${user.activities || 0}</td>
        <td class="px-4 py-2">${user.score || 0}</td>
        <td class="px-4 py-2" title="${user.lastLogin || 'Never'}">${this.timeAgo(user.lastLogin || user.timestamp)}</td>
        <td class="px-4 py-2">${user.syncStatus === "local" ? "📱 Local" : "✅ Synced"}</td>
        <td class="px-4 py-2"><button onclick="window.adminPanel?.deleteUser('${user.userId}')" class="bg-red-500 text-white px-2 py-1 rounded text-sm">Delete</button> <button onclick="window.adminPanel?.viewUser('${user.userId}')" class="bg-blue-500 text-white px-2 py-1 rounded text-sm">View</button></td>
      </tr>
    `).join("");
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
      tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4">No match</td></tr>';
      return;
    }
    
    tbody.innerHTML = filtered.map((user, idx) => `
      <tr class="border-b hover:bg-gray-50">
        <td class="px-4 py-2">${idx + 1}</td>
        <td class="px-4 py-2">${user.name || "Unknown"}</td>
        <td class="px-4 py-2">${user.activities || 0}</td>
        <td class="px-4 py-2">${user.score || 0}</td>
        <td class="px-4 py-2">${this.timeAgo(user.timestamp)}</td>
        <td class="px-4 py-2">${user.syncStatus === "local" ? "📱 Local" : "✅ Synced"}</td>
        <td class="px-4 py-2"><button onclick="window.adminPanel?.deleteUser('${user.userId}')" class="bg-red-500 text-white px-2 py-1 rounded text-sm">Delete</button> <button onclick="window.adminPanel?.viewUser('${user.userId}')" class="bg-blue-500 text-white px-2 py-1 rounded text-sm">View</button></td>
      </tr>
    `).join("");
  }

  deleteUser(userId) {
    const user = this.users.find(u => u.userId === userId);
    if (!user) return;
    
    if (!confirm(`⚠️ Delete user "${user.name}"? This cannot be undone!`)) return;
    if (!confirm("Are you absolutely sure?")) return;
    
    localStorage.removeItem(`activityProgress_${userId}`);
    localStorage.removeItem(`userSettings_${userId}`);
    this.users = this.users.filter(u => u.userId !== userId);
    this.renderTable();
    this.notify("✅ User deleted", "success");
  }

  viewUser(userId) {
    const user = this.users.find(u => u.userId === userId);
    if (user) alert(`User: ${user.name}\nScore: ${user.score}\nActivities: ${user.activities}`);
  }

  exportUsersData() {
    const json = JSON.stringify(this.users, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users_${new Date().getTime()}.json`;
    a.click();
    this.notify("✅ JSON exported", "success");
  }

  exportCSV() {
    if (this.users.length === 0) {
      this.notify("❌ No users to export", "warning");
      return;
    }

    const headers = ["Name", "Score", "Activities Completed", "Last Login", "Created Date"];
    const rows = this.users.map(u => [
      `"${u.name}"`,
      u.score || 0,
      u.activities || 0,
      u.lastLogin || u.timestamp || "Never",
      u.timestamp || "Unknown"
    ]);

    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    this.notify("✅ CSV exported", "success");
  }

  confirmClearAllData() {
    if (!confirm("⚠️ Delete ALL user data? This cannot be undone!")) return;
    if (!confirm("Are you ABSOLUTELY sure? Type YES in the next prompt.")) return;
    
    const response = prompt("Type 'DELETE ALL' to confirm:");
    if (response === "DELETE ALL") {
      this.clearAllData();
    } else {
      this.notify("❌ Cancelled", "info");
    }
  }

  clearAllData() {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key.startsWith("activityProgress_") || key.startsWith("userSettings_")) localStorage.removeItem(key);
    }
    this.users = [];
    this.renderTable();
    this.notify("✅ All data cleared", "success");
  }

  startAutoRefresh() {
    if (this.autoRefreshInterval) return;
    this.autoRefreshInterval = setInterval(() => {
      if (this.isAuthenticated && document.getElementById("adminPanel")?.style.display === "block") {
        this.loadUsers();
      }
    }, 30000); // Refresh every 30 seconds instead of 10
  }

  stopAutoRefresh() {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
      this.autoRefreshInterval = null;
    }
  }

  timeAgo(timestamp) {
    if (!timestamp) return "Unknown";
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
    document.body.appendChild(el);
    setTimeout(() => el.classList.add("admin-toast-show"), 10);
    setTimeout(() => {
      el.classList.remove("admin-toast-show");
      setTimeout(() => el.remove(), 300);
    }, 3000);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.adminPanel = new AdminPanel();
});
