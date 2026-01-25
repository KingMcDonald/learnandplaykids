/**
 * Admin Panel - Simple user management
 */

class AdminPanel {
  constructor() {
    this.users = [];
    this.isAuthenticated = false;
    this.adminPassword = "AdminGrade12";
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    this.apiEndpoint = isLocal ? "http://localhost:3000/sync" : "/.netlify/functions/sync";
    this.autoRefreshInterval = null;
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadUsers();
    if (this.isAuthenticated) this.startAutoRefresh();
  }

  setupEventListeners() {
    let titleClickCount = 0;
    const titleElement = document.getElementById("appTitle");
    if (titleElement) {
      titleElement.addEventListener("click", () => {
        titleClickCount++;
        if (titleClickCount === 5) {
          this.showLoginModal();
          titleClickCount = 0;
        }
        setTimeout(() => { titleClickCount = 0; }, 3000);
      });
    }
    document.getElementById("adminLoginBtn")?.addEventListener("click", () => this.showLoginModal());
    document.getElementById("adminLogoutBtn")?.addEventListener("click", () => this.logout());
    document.getElementById("adminAuthBtn")?.addEventListener("click", () => this.authenticate());
    document.getElementById("adminRefreshBtn")?.addEventListener("click", () => this.loadUsers());
    document.getElementById("adminSearchInput")?.addEventListener("input", (e) => this.filterUsers(e.target.value));
    document.getElementById("adminExportBtn")?.addEventListener("click", () => this.exportUsersData());
    document.getElementById("adminClearBtn")?.addEventListener("click", () => this.confirmClearAllData());
    const modal = document.getElementById("adminAuthModal");
    if (modal) modal.addEventListener("click", (e) => { if (e.target === modal) this.closeLoginModal(); });
    const passwordInput = document.getElementById("adminPasswordInput");
    if (passwordInput) passwordInput.addEventListener("keypress", (e) => { if (e.key === "Enter") this.authenticate(); });
  }

  showLoginModal() {
    const modal = document.getElementById("adminAuthModal");
    if (modal) {
      modal.classList.remove("hidden");
      modal.classList.add("visible");
      document.getElementById("adminPasswordInput").focus();
    }
  }

  closeLoginModal() {
    const modal = document.getElementById("adminAuthModal");
    if (modal) {
      modal.classList.add("hidden");
      modal.classList.remove("visible");
      document.getElementById("adminPasswordInput").value = "";
    }
  }

  authenticate() {
    const password = document.getElementById("adminPasswordInput").value;
    if (password === this.adminPassword) {
      this.isAuthenticated = true;
      this.closeLoginModal();
      document.getElementById("adminSection").classList.remove("hidden");
      document.getElementById("adminLoginBtn").classList.add("hidden");
      document.getElementById("adminLogoutBtn").classList.remove("hidden");
      this.startAutoRefresh();
      this.loadUsers();
      this.notify("Admin access granted!", "success");
    } else {
      this.notify("Wrong password", "error");
      document.getElementById("adminPasswordInput").value = "";
    }
  }

  logout() {
    this.isAuthenticated = false;
    document.getElementById("adminSection").classList.add("hidden");
    document.getElementById("adminLoginBtn").classList.remove("hidden");
    document.getElementById("adminLogoutBtn").classList.add("hidden");
    this.stopAutoRefresh();
    this.notify("Logged out", "info");
  }

  async loadUsers() {
    try {
      const response = await fetch(`${this.apiEndpoint}?action=getAllUsers`, { timeout: 5000 });
      if (response.ok) {
        const data = await response.json();
        this.users = Array.isArray(data) ? data : [];
        this.renderTable();
      } else {
        this.loadFromLocalStorage();
        this.renderTable();
      }
    } catch (error) {
      this.loadFromLocalStorage();
      this.renderTable();
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
        this.users.push({
          userId, name: settings.name || userId, activities, score, syncStatus: "local", timestamp: new Date().toISOString()
        });
      }
    }
  }

  renderTable() {
    const tbody = document.getElementById("adminUsersTableBody");
    if (!tbody) return;
    if (this.users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4">No users found</td></tr>';
      return;
    }
    tbody.innerHTML = this.users.map(user => `
      <tr class="border-b hover:bg-gray-50">
        <td class="px-4 py-2">${user.name}</td>
        <td class="px-4 py-2">${user.score || 0}</td>
        <td class="px-4 py-2">${user.activities || 0}</td>
        <td class="px-4 py-2">${this.timeAgo(user.timestamp)}</td>
        <td class="px-4 py-2 admin-sync-status">${user.syncStatus === "local" ? "📱 Local" : "✅ Synced"}</td>
        <td class="px-4 py-2"><button onclick="adminPanel.deleteUser('${user.userId}')" class="bg-red-500 text-white px-2 py-1 rounded text-sm">Delete</button></td>
        <td class="px-4 py-2"><button onclick="adminPanel.viewUser('${user.userId}')" class="bg-blue-500 text-white px-2 py-1 rounded text-sm">View</button></td>
      </tr>
    `).join("");
  }

  filterUsers(term) {
    if (!term.trim()) { this.renderTable(); return; }
    const filtered = this.users.filter(u => u.name.toLowerCase().includes(term.toLowerCase()) || u.userId.toLowerCase().includes(term.toLowerCase()));
    const tbody = document.getElementById("adminUsersTableBody");
    if (tbody) tbody.innerHTML = filtered.length === 0 ? '<tr><td colspan="7" class="text-center py-4">No match</td></tr>' : filtered.map(user => `
      <tr class="border-b hover:bg-gray-50">
        <td class="px-4 py-2">${user.name}</td>
        <td class="px-4 py-2">${user.score || 0}</td>
        <td class="px-4 py-2">${user.activities || 0}</td>
        <td class="px-4 py-2">${this.timeAgo(user.timestamp)}</td>
        <td class="px-4 py-2 admin-sync-status">${user.syncStatus === "local" ? "📱 Local" : "✅ Synced"}</td>
        <td class="px-4 py-2"><button onclick="adminPanel.deleteUser('${user.userId}')" class="bg-red-500 text-white px-2 py-1 rounded text-sm">Delete</button></td>
        <td class="px-4 py-2"><button onclick="adminPanel.viewUser('${user.userId}')" class="bg-blue-500 text-white px-2 py-1 rounded text-sm">View</button></td>
      </tr>
    `).join("");
  }

  deleteUser(userId) {
    if (!confirm(`Delete user ${userId}?`)) return;
    localStorage.removeItem(`activityProgress_${userId}`);
    localStorage.removeItem(`userSettings_${userId}`);
    this.users = this.users.filter(u => u.userId !== userId);
    this.renderTable();
    this.notify("User deleted", "success");
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
    this.notify("Data exported", "success");
  }

  confirmClearAllData() {
    if (confirm("Delete all user data? This cannot be undone.")) {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key.startsWith("activityProgress_") || key.startsWith("userSettings_")) localStorage.removeItem(key);
      }
      this.users = [];
      this.renderTable();
      this.notify("All data cleared", "success");
    }
  }

  startAutoRefresh() {
    if (this.autoRefreshInterval) return;
    this.autoRefreshInterval = setInterval(() => {
      const tbody = document.getElementById("adminUsersTableBody");
      if (tbody && this.isAuthenticated) this.loadUsers();
    }, 10000);
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
    el.className = `fixed top-4 right-4 px-4 py-2 rounded text-white notification-${type}`;
    el.textContent = msg;
    el.style.backgroundColor = type === "success" ? "#4CAF50" : type === "error" ? "#f44336" : "#2196F3";
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.adminPanel = new AdminPanel();
});
