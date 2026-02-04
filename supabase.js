/**
 * Supabase Configuration & Cloud Sync
 * Replaces Netlify Functions for multi-device data synchronization
 */

const SUPABASE_URL = "https://jytsrqshnvkkuxlobisg.supabase.co";
const SUPABASE_KEY = "sb_publishable_SeBo1YRkv3Os5xG10LFo6Q_OyAmU1yd";

// Initialize Supabase client
const supabaseClient = (() => {
  // Simple Supabase REST client
  const headers = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`
  };

  return {
    url: SUPABASE_URL,
    headers: headers,

    // GET - Fetch data
    async get(table, query = {}) {
      try {
        let url = `${this.url}/rest/v1/${table}?select=*`;
        if (query.filter) url += `&${query.filter}`;
        if (query.order) url += `&order=${query.order}`;
        if (query.limit) url += `&limit=${query.limit}`;

        const response = await fetch(url, {
          method: 'GET',
          headers: this.headers
        });

        if (!response.ok) {
          console.error(`Supabase GET error: ${response.status} ${response.statusText}`);
          return null;
        }
        return await response.json();
      } catch (error) {
        console.error("Supabase GET failed:", error);
        return null;
      }
    },

    // POST - Insert data
    async insert(table, data) {
      try {
        const response = await fetch(`${this.url}/rest/v1/${table}`, {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify(data)
        });

        if (!response.ok) {
          const error = await response.json();
          console.error(`Supabase INSERT error:`, error);
          return null;
        }
        return await response.json();
      } catch (error) {
        console.error("Supabase INSERT failed:", error);
        return null;
      }
    },

    // PATCH - Update data
    async update(table, data, filter) {
      try {
        let url = `${this.url}/rest/v1/${table}?`;
        if (typeof filter === 'string') {
          url += filter;
        } else if (filter.userId) {
          url += `userId=eq.${filter.userId}`;
        }

        const response = await fetch(url, {
          method: 'PATCH',
          headers: this.headers,
          body: JSON.stringify(data)
        });

        if (!response.ok) {
          const error = await response.json();
          console.error(`Supabase UPDATE error:`, error);
          return null;
        }
        return await response.json();
      } catch (error) {
        console.error("Supabase UPDATE failed:", error);
        return null;
      }
    },

    // DELETE - Remove data
    async delete(table, filter) {
      try {
        let url = `${this.url}/rest/v1/${table}?`;
        if (typeof filter === 'string') {
          url += filter;
        } else if (filter.userId) {
          url += `userId=eq.${filter.userId}`;
        }

        const response = await fetch(url, {
          method: 'DELETE',
          headers: this.headers
        });

        if (!response.ok) {
          const error = await response.json();
          console.error(`Supabase DELETE error:`, error);
          return null;
        }
        return await response.json();
      } catch (error) {
        console.error("Supabase DELETE failed:", error);
        return null;
      }
    },

    // RPC - Call stored procedures
    async rpc(functionName, params = {}) {
      try {
        const response = await fetch(
          `${this.url}/rest/v1/rpc/${functionName}`,
          {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify(params)
          }
        );

        if (!response.ok) {
          console.error(`Supabase RPC error: ${response.status}`);
          return null;
        }
        return await response.json();
      } catch (error) {
        console.error("Supabase RPC failed:", error);
        return null;
      }
    }
  };
})();

/**
 * Cloud Sync Manager - Handles all Supabase operations
 */
class CloudSyncManager {
  static async saveUser(userId, userName, gameData) {
    try {
      const userData = {
        id: userId,
        name: userName,
        total_score: gameData.score || 0,
        accuracy: gameData.stats?.accuracy || null,
        response_time: gameData.stats?.responseTime || null,
        session_count: (gameData.sessionData || []).length,
        last_login: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Try to update first
      const existing = await supabaseClient.get('users', {
        filter: `id=eq.${userId}`
      });

      if (existing && existing.length > 0) {
        // Update existing user
        await supabaseClient.update('users', userData, { id: userId });
        console.log("☁️ User updated in Supabase");
      } else {
        // Insert new user
        userData.created_at = new Date().toISOString();
        await supabaseClient.insert('users', userData);
        console.log("☁️ User created in Supabase");
      }

      // Save detailed session data for research
      if (gameData.sessionData && gameData.sessionData.length > 0) {
        for (const session of gameData.sessionData) {
          await supabaseClient.insert('session_data', {
            user_id: userId,
            activity_name: session.activity || 'unknown',
            is_correct: session.isCorrect || false,
            points_earned: session.points || 0,
            difficulty: session.difficulty || null,
            response_time: session.responseTime || null,
            timestamp: session.timestamp || new Date().toISOString()
          });
        }
        console.log("☁️ Session data saved");
      }

      return true;
    } catch (error) {
      console.error("Error saving to cloud:", error);
      return false;
    }
  }

  static async getAllUsers() {
    try {
      const users = await supabaseClient.get('users', {
        order: 'total_score.desc'
      });
      return users || [];
    } catch (error) {
      console.error("Error fetching users:", error);
      return [];
    }
  }

  static async getUser(userId) {
    try {
      const users = await supabaseClient.get('users', {
        filter: `id=eq.${userId}`
      });
      return users && users.length > 0 ? users[0] : null;
    } catch (error) {
      console.error("Error fetching user:", error);
      return null;
    }
  }

  static async deleteUser(userId) {
    try {
      // Delete all sessions first
      await supabaseClient.delete('session_data', { user_id: userId });
      // Delete user
      await supabaseClient.delete('users', { id: userId });
      console.log("☁️ User deleted from cloud");
      return true;
    } catch (error) {
      console.error("Error deleting user:", error);
      return false;
    }
  }

  static async getUserStats() {
    try {
      const users = await supabaseClient.get('users');
      if (!users || users.length === 0) return null;

      const totalUsers = users.length;
      const totalScore = users.reduce((sum, u) => sum + (u.total_score || 0), 0);
      const avgScore = (totalScore / totalUsers).toFixed(1);
      const avgAccuracy = (users.reduce((sum, u) => sum + (u.accuracy || 0), 0) / totalUsers).toFixed(1);
      const activeUsers = users.filter(u => {
        const lastLogin = new Date(u.last_login);
        const now = new Date();
        return (now - lastLogin) < 24 * 60 * 60 * 1000;
      }).length;

      return {
        totalUsers,
        totalScore,
        avgScore: parseFloat(avgScore),
        avgAccuracy: parseFloat(avgAccuracy),
        activeUsers
      };
    } catch (error) {
      console.error("Error fetching stats:", error);
      return null;
    }
  }

  static async syncToCloud(userId, userName, gameData) {
    // Background sync - non-blocking
    try {
      this.saveUser(userId, userName, gameData).catch(() => {
        console.debug("Background sync failed, will retry");
      });
    } catch (e) {
      console.debug("Sync error:", e);
    }
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { supabaseClient, CloudSyncManager };
}
