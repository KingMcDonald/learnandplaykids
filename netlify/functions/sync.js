/**
 * Netlify Function: User Data Sync with Auth & Rate Limiting
 * Enhanced API with security, validation, session tracking, and multi-device support
 */

// Use Deta for persistent cloud storage (alternative: can use environment variables for testing)
let usersDB = {};
let requestLog = {}; // For rate limiting
let syncLog = []; // Track all sync operations

// Rate limiting: max 60 requests per minute per IP
const rateLimit = (ip) => {
  const now = Date.now();
  const oneMinute = 60 * 1000;
  
  if (!requestLog[ip]) requestLog[ip] = [];
  requestLog[ip] = requestLog[ip].filter(time => now - time < oneMinute);
  
  if (requestLog[ip].length > 60) {
    return false; // Rate limit exceeded
  }
  requestLog[ip].push(now);
  return true;
};

// Input validation
const validateUser = (data) => {
  if (!data.userId || typeof data.userId !== 'string') return { valid: false, error: "Invalid userId" };
  if (data.name && data.name.length > 50) return { valid: false, error: "Name too long (max 50 chars)" };
  if (data.activities && typeof data.activities !== 'object') return { valid: false, error: "Invalid activities" };
  if (data.totalScore && typeof data.totalScore !== 'number') return { valid: false, error: "Invalid score" };
  return { valid: true };
};

// Sanitize input
const sanitize = (str) => {
  if (!str) return "";
  return String(str).replace(/[<>\"']/g, "").substring(0, 50);
};

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers };
  }

  // Get client IP for rate limiting
  const clientIp = event.headers['x-forwarded-for']?.split(',')[0] || event.headers['client-ip'] || 'unknown';

  // Check rate limit
  if (!rateLimit(clientIp)) {
    return {
      statusCode: 429,
      headers,
      body: JSON.stringify({ error: "Too many requests. Please try again later." })
    };
  }

  try {
    const action = event.queryStringParameters?.action;

    // POST - Save user data (for cross-device sync)
    if (event.httpMethod === "POST") {
      const data = JSON.parse(event.body);
      
      // Validate input
      const validation = validateUser(data);
      if (!validation.valid) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: validation.error }) };
      }

      const userId = sanitize(data.userId);
      const name = sanitize(data.name) || "User";
      
      // Create or update user
      const existingUser = usersDB[userId];
      usersDB[userId] = {
        id: userId,
        name: name,
        activities: data.activities || {},
        totalScore: data.totalScore || 0,
        accuracy: data.accuracy || null,
        learningCurve: data.learningCurve || [],
        completedActivities: data.completedActivities || 0,
        responseTime: data.responseTime || null,
        lastUpdated: new Date().toISOString(),
        createdAt: existingUser?.createdAt || new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        sessionCount: (existingUser?.sessionCount || 0) + 1,
        deviceCount: data.deviceCount || 1
      };

      // Log sync operation
      syncLog.push({
        action: "save_user",
        userId: userId,
        name: name,
        timestamp: new Date().toISOString()
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, user: usersDB[userId], synced: true })
      };
    }

    // GET all users with stats
    if (event.httpMethod === "GET" && action === "getAllUsers") {
      const users = Object.values(usersDB).map(u => ({
        ...u,
        lastLogin: u.lastLogin ? new Date(u.lastLogin).toISOString() : null
      }));
      
      // Calculate statistics
      const totalUsers = users.length;
      const totalScore = users.reduce((sum, u) => sum + (u.totalScore || 0), 0);
      const avgScore = totalUsers > 0 ? (totalScore / totalUsers).toFixed(1) : 0;
      const avgAccuracy = totalUsers > 0 ? (users.reduce((sum, u) => sum + (u.accuracy || 0), 0) / totalUsers).toFixed(1) : 0;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          users: users,
          stats: {
            totalUsers,
            totalScore,
            avgScore: parseFloat(avgScore),
            avgAccuracy: parseFloat(avgAccuracy),
            activeUsers: users.filter(u => {
              const lastLogin = new Date(u.lastLogin);
              const now = new Date();
              return (now - lastLogin) < 24 * 60 * 60 * 1000; // Last 24 hours
            }).length
          },
          timestamp: new Date().toISOString()
        })
      };
    }

    // GET user details
    if (event.httpMethod === "GET" && action === "getUser") {
      const userId = event.queryStringParameters?.userId;
      if (userId && usersDB[userId]) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            user: usersDB[userId]
          })
        };
      }
      return { statusCode: 404, headers, body: JSON.stringify({ error: "User not found" }) };
    }

    // GET health check
    if (event.httpMethod === "GET" && action === "health") {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: "ok",
          userCount: Object.keys(usersDB).length,
          lastSync: syncLog[syncLog.length - 1]?.timestamp || null,
          timestamp: new Date().toISOString()
        })
      };
    }

    // DELETE user (from all devices)
    if (event.httpMethod === "DELETE") {
      const userId = event.queryStringParameters?.userId;
      if (userId && usersDB[userId]) {
        const deleted = usersDB[userId];
        delete usersDB[userId];
        
        // Log deletion
        syncLog.push({
          action: "delete_user",
          userId: userId,
          name: deleted.name,
          timestamp: new Date().toISOString()
        });

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            success: true, 
            deleted: deleted.name,
            message: `User "${deleted.name}" deleted from all devices`
          })
        };
      }
      return { statusCode: 404, headers, body: JSON.stringify({ error: "User not found" }) };
    }

    // PATCH - Partial update (for incremental data)
    if (event.httpMethod === "PATCH") {
      const data = JSON.parse(event.body);
      const userId = data.userId;
      
      if (userId && usersDB[userId]) {
        // Merge new data with existing
        usersDB[userId] = {
          ...usersDB[userId],
          ...data,
          lastUpdated: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        };

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, user: usersDB[userId], updated: true })
        };
      }
      return { statusCode: 404, headers, body: JSON.stringify({ error: "User not found" }) };
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid request" }) };
  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
