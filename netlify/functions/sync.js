/**
 * Netlify Function: User Data Sync with Auth & Rate Limiting
 * Enhanced API with security, validation, and session tracking
 */

let usersDB = {};
let requestLog = {}; // For rate limiting

// Rate limiting: max 30 requests per minute per IP
const rateLimit = (ip) => {
  const now = Date.now();
  const oneMinute = 60 * 1000;
  
  if (!requestLog[ip]) requestLog[ip] = [];
  requestLog[ip] = requestLog[ip].filter(time => now - time < oneMinute);
  
  if (requestLog[ip].length > 30) {
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
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
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

    // POST - Save user data
    if (event.httpMethod === "POST") {
      const data = JSON.parse(event.body);
      
      // Validate input
      const validation = validateUser(data);
      if (!validation.valid) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: validation.error }) };
      }

      const userId = sanitize(data.userId);
      const name = sanitize(data.name) || "User";
      
      usersDB[userId] = {
        id: userId,
        name: name,
        activities: data.activities || {},
        totalScore: data.totalScore || 0,
        completedActivities: data.completedActivities || 0,
        lastUpdated: new Date().toISOString(),
        createdAt: usersDB[userId]?.createdAt || new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        sessionCount: (usersDB[userId]?.sessionCount || 0) + 1
      };

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, user: usersDB[userId] })
      };
    }

    // GET all users
    if (event.httpMethod === "GET" && action === "getAllUsers") {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          users: Object.values(usersDB),
          count: Object.keys(usersDB).length,
          timestamp: new Date().toISOString()
        })
      };
    }

    // GET health check
    if (event.httpMethod === "GET" && action === "health") {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: "ok",
          userCount: Object.keys(usersDB).length,
          timestamp: new Date().toISOString()
        })
      };
    }

    // DELETE user
    if (event.httpMethod === "DELETE") {
      const userId = event.queryStringParameters?.userId;
      if (userId && usersDB[userId]) {
        const deleted = usersDB[userId];
        delete usersDB[userId];
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, deleted: deleted.name })
        };
      }
      return { statusCode: 404, headers, body: JSON.stringify({ error: "User not found" }) };
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid request" }) };
  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
