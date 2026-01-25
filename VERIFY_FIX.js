// ============================================================
// ADMIN PANEL FIX - VERIFICATION SCRIPT
// Run this in browser DevTools Console (F12) after applying fix
// ============================================================

console.log("🔍 ADMIN PANEL FIX VERIFICATION SCRIPT");
console.log("=====================================\n");

// Helper function to hash username (same as game)
function hashUsername(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function normalizeUsername(name) {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

// ============================================================
// TEST 1: Check localStorage structure
// ============================================================
console.log("TEST 1: Checking localStorage structure...\n");
console.log(`Total items in localStorage: ${localStorage.length}\n`);

if (localStorage.length === 0) {
  console.warn("⚠️  localStorage is empty! Kids need to play an activity first.");
  console.log("\nNext step: Play a game activity, then run this script again.\n");
} else {
  // Count by type
  let adminKeys = 0;
  let gameKeys = 0;
  let otherKeys = 0;
  const keyList = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    keyList.push(key);
    
    if (key.startsWith('activityProgress_') || key.startsWith('userSettings_')) {
      adminKeys++;
    } else if (key.startsWith('kg_')) {
      gameKeys++;
    } else {
      otherKeys++;
    }
  }

  console.log(`✅ Admin format keys (activityProgress_, userSettings_): ${adminKeys}`);
  console.log(`✅ Game format keys (kg_): ${gameKeys}`);
  console.log(`ℹ️  Other keys: ${otherKeys}\n`);

  if (adminKeys === 0) {
    console.error("❌ PROBLEM: No admin format keys found!");
    console.log("   The game should be saving activityProgress_ and userSettings_ keys.");
    console.log("   Try playing another activity to trigger the save.\n");
  } else {
    console.log("✅ GOOD: Admin format keys are present!\n");
  }
}

// ============================================================
// TEST 2: Simulate what admin panel sees
// ============================================================
console.log("TEST 2: Simulating admin panel user detection...\n");

const users = [];
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  
  if (key && key.startsWith('activityProgress_')) {
    const userId = key.replace('activityProgress_', '');
    try {
      const progressData = JSON.parse(localStorage.getItem(key)) || {};
      const settingsStr = localStorage.getItem(`userSettings_${userId}`) || '{"name":"Unknown"}';
      const settings = JSON.parse(settingsStr);
      
      users.push({
        userId,
        name: settings.name || 'Unknown Player',
        score: progressData.score || 0,
        plantStage: progressData.plantStage || 0,
        sessionCount: progressData.sessionCount || 0,
        lastLogin: localStorage.getItem(`lastLogin_${userId}`)
      });
    } catch (err) {
      console.error(`❌ Error parsing user data for ${userId}:`, err);
    }
  }
}

if (users.length === 0) {
  console.error("❌ PROBLEM: Admin panel would find NO users!");
  console.log("   Try playing an activity and this should fix itself.\n");
} else {
  console.log(`✅ GOOD: Admin panel would see ${users.length} user(s):\n`);
  users.forEach((user, idx) => {
    console.log(`   ${idx + 1}. "${user.name}"`);
    console.log(`      ID: ${user.userId}`);
    console.log(`      Score: ${user.score} pts`);
    console.log(`      Plant: Stage ${user.plantStage}`);
    console.log(`      Activities: ${user.sessionCount}`);
    console.log('');
  });
}

// ============================================================
// TEST 3: Verify game saves data in both formats
// ============================================================
console.log("TEST 3: Verifying game saves both formats...\n");

let dualFormatWorking = true;
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  
  if (key && key.startsWith('activityProgress_')) {
    const userId = key.replace('activityProgress_', '');
    const hasGameFormat = localStorage.getItem(`kg_${userId}`) !== null;
    const hasSettingsFormat = localStorage.getItem(`userSettings_${userId}`) !== null;
    const hasLoginTracking = localStorage.getItem(`lastLogin_${userId}`) !== null;
    
    if (!hasGameFormat || !hasSettingsFormat) {
      console.warn(`⚠️  User ${userId}: Missing some format keys`);
      dualFormatWorking = false;
    }
  }
}

if (dualFormatWorking && users.length > 0) {
  console.log("✅ GOOD: Game is saving in both formats correctly!\n");
} else if (users.length > 0) {
  console.warn("⚠️  Some format inconsistencies detected. This might be from old data.\n");
}

// ============================================================
// TEST 4: Simulate admin login flow
// ============================================================
console.log("TEST 4: Simulating admin login flow...\n");

// Check admin panel elements exist
const adminPanel = document.getElementById("adminPanel");
const adminAuthModal = document.getElementById("adminAuthModal");
const adminUsersTableBody = document.getElementById("adminUsersTableBody");
const adminPassword = document.getElementById("adminPassword");

let adminElementsReady = true;
if (!adminPanel) {
  console.error("❌ Admin panel div not found (id='adminPanel')");
  adminElementsReady = false;
}
if (!adminAuthModal) {
  console.error("❌ Admin auth modal not found (id='adminAuthModal')");
  adminElementsReady = false;
}
if (!adminUsersTableBody) {
  console.error("❌ Admin users table body not found (id='adminUsersTableBody')");
  adminElementsReady = false;
}
if (!adminPassword) {
  console.error("❌ Admin password input not found (id='adminPassword')");
  adminElementsReady = false;
}

if (adminElementsReady) {
  console.log("✅ GOOD: All required admin panel elements are present!\n");
} else {
  console.error("❌ PROBLEM: Some admin panel elements are missing!\n");
}

// ============================================================
// FINAL SUMMARY
// ============================================================
console.log("=====================================");
console.log("SUMMARY\n");

let issueCount = 0;

if (localStorage.length === 0) {
  console.error("❌ No data in localStorage (expected if first time)");
  issueCount++;
} else if (users.length === 0) {
  console.error("❌ Admin format keys missing - FIX NOT WORKING");
  issueCount++;
} else {
  console.log(`✅ ${users.length} user(s) found in admin format`);
}

if (!adminElementsReady) {
  console.error("❌ Admin UI elements missing");
  issueCount++;
} else {
  console.log("✅ Admin UI elements ready");
}

console.log("\n=====================================");
if (issueCount === 0) {
  if (users.length > 0) {
    console.log("✅ VERIFICATION PASSED!");
    console.log("\nAdmin panel should now show users correctly.");
    console.log("Steps to verify:");
    console.log("  1. Click score display 5 times");
    console.log("  2. Click 'Admin Access' button");
    console.log("  3. Enter password: AdminGrade12");
    console.log("  4. You should see the user(s) in the table\n");
  } else {
    console.log("⚠️  WAITING FOR USER DATA");
    console.log("\nTo test the fix:");
    console.log("  1. Play an activity (click through a few questions)");
    console.log("  2. Complete it (finish the activity)");
    console.log("  3. Run this verification script again\n");
  }
} else {
  console.error("❌ VERIFICATION FAILED!");
  console.error(`${issueCount} issue(s) found. Check above for details.\n`);
}

console.log("For detailed debugging, run:");
console.log("  localStorage.clear()  // if you want to start fresh");
console.log("  location.reload()     // then play an activity again\n");

// Copy-paste helper
console.log("Copy this entire message by selecting and Ctrl+C");
