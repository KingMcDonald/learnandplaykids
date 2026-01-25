/**
 * Netlify Function: User Data Sync
 * Simple API for offline-first sync
 */

let usersDB = {};

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

  try {
    const action = event.queryStringParameters?.action;

    // POST - Save user data
    if (event.httpMethod === "POST") {
      const { userId, name, activities, totalScore, completedActivities, timestamp } = JSON.parse(event.body);
      if (!userId) return { statusCode: 400, headers, body: JSON.stringify({ error: "userId required" }) };

      usersDB[userId] = {
        id: userId,
        name: name || "User",
        activities: activities || {},
        totalScore: totalScore || 0,
        completedActivities: completedActivities || 0,
        lastUpdated: timestamp || new Date().toISOString(),
        createdAt: usersDB[userId]?.createdAt || new Date().toISOString()
      };

      return { statusCode: 200, headers, body: JSON.stringify({ success: true, user: usersDB[userId] }) };
    }

    // GET all users
    if (event.httpMethod === "GET" && action === "getAllUsers") {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, users: Object.values(usersDB), count: Object.keys(usersDB).length })
      };
    }

    // GET health
    if (event.httpMethod === "GET" && action === "health") {
      return { statusCode: 200, headers, body: JSON.stringify({ status: "ok", userCount: Object.keys(usersDB).length }) };
    }

    // DELETE user
    if (event.httpMethod === "DELETE") {
      const userId = event.queryStringParameters?.userId;
      if (userId && usersDB[userId]) {
        delete usersDB[userId];
        return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
      }
      return { statusCode: 404, headers, body: JSON.stringify({ error: "User not found" }) };
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid request" }) };
  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
