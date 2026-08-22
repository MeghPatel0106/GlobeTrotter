import assert from "node:assert";

const API_BASE = "http://localhost:4000";

async function runAdminQASuite() {
  console.log("=================================================");
  console.log("🚀 STARTING GLOBETROTTER ADMIN / ANALYTICS QA SUITE");
  console.log("=================================================\n");

  const timestamp = Date.now();

  // 1. Register a regular test user (Role: USER)
  console.log("Step 1: Registering regular test explorer (Role: USER)...");
  const regularEmail = `regular_${timestamp}@globetrotter.test`;
  const regRes = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      firstName: "Regular",
      lastName: "Explorer",
      username: `explorer_${timestamp}`,
      email: regularEmail,
      password: "Password@123",
      city: "Mumbai",
      country: "India",
    }),
  });
  assert.strictEqual(regRes.status, 201, "Regular user registration should succeed");
  const regData = await regRes.json();
  const regularToken = regData.token;
  console.log("  ✅ [PASS] Regular explorer registered successfully (Role: USER)");

  // 2. Test RBAC: Regular user must be blocked (403 Forbidden) from all /admin/* routes
  console.log("\nStep 2: Testing RBAC security: non-admin user must be rejected with 403 Forbidden...");
  
  const endpoints = [
    "/admin/users",
    "/admin/analytics/summary",
    "/admin/analytics/cities",
    "/admin/analytics/activities",
    "/admin/analytics/trends",
  ];

  for (const endpoint of endpoints) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: { Authorization: `Bearer ${regularToken}` },
    });
    assert.strictEqual(res.status, 403, `Non-admin must get 403 Forbidden on ${endpoint}`);
  }
  console.log("  ✅ [PASS] All 5 admin endpoints strictly reject non-admin users with 403 Forbidden");

  // 3. Test unauthenticated access: Anonymous must be blocked (401 Unauthorized)
  console.log("\nStep 3: Testing unauthenticated requests: Anonymous must receive 401 Unauthorized...");
  for (const endpoint of endpoints) {
    const res = await fetch(`${API_BASE}${endpoint}`);
    assert.strictEqual(res.status, 401, `Anonymous request must get 401 on ${endpoint}`);
  }
  console.log("  ✅ [PASS] Anonymous requests blocked with 401 Unauthorized");

  // 4. Authenticate as ADMIN
  console.log("\nStep 4: Authenticating as seeded ADMIN user (admin@globetrotter.com)...");
  const adminLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identifier: "admin@globetrotter.com",
      password: "Admin@1234",
    }),
  });
  assert.strictEqual(adminLoginRes.status, 200, "Admin login should succeed");
  const adminData = await adminLoginRes.json();
  assert.strictEqual(adminData.user.role, "ADMIN", "Logged in user must have ADMIN role");
  const adminToken = adminData.token;
  console.log("  ✅ [PASS] Admin authenticated successfully (Role: ADMIN verified)");

  // 5. Test GET /admin/analytics/summary
  console.log("\nStep 5: Testing GET /admin/analytics/summary with admin credentials...");
  const summaryRes = await fetch(`${API_BASE}/admin/analytics/summary`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.strictEqual(summaryRes.status, 200, "GET /admin/analytics/summary should succeed");
  const summary = await summaryRes.json();
  assert.ok(typeof summary.totalUsers === "number", "totalUsers should be a number");
  assert.ok(typeof summary.totalTrips === "number", "totalTrips should be a number");
  assert.ok(typeof summary.totalPublicTrips === "number", "totalPublicTrips should be a number");
  assert.ok(typeof summary.totalActivitiesPlanned === "number", "totalActivitiesPlanned should be a number");
  console.log(`  ✅ [PASS] Summary KPI telemetry received (Total Users: ${summary.totalUsers}, Total Trips: ${summary.totalTrips})`);

  // 6. Test GET /admin/users
  console.log("\nStep 6: Testing GET /admin/users with admin credentials...");
  const usersRes = await fetch(`${API_BASE}/admin/users`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.strictEqual(usersRes.status, 200, "GET /admin/users should succeed");
  const usersList = await usersRes.json();
  assert.ok(Array.isArray(usersList), "Users should be an array");
  assert.ok(usersList.length > 0, "Users array should contain registered users");
  const foundUser = usersList.find((u) => u.email === regularEmail);
  assert.ok(foundUser, "Newly registered regular user should be in users list");
  assert.ok(foundUser.passwordHash === undefined, "Password hash must never be leaked in user list");
  console.log(`  ✅ [PASS] Users directory retrieved (${usersList.length} users listed, passwords omitted)`);

  // 7. Test GET /admin/analytics/cities
  console.log("\nStep 7: Testing GET /admin/analytics/cities with admin credentials...");
  const citiesRes = await fetch(`${API_BASE}/admin/analytics/cities?limit=5`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.strictEqual(citiesRes.status, 200, "GET /admin/analytics/cities should succeed");
  const citiesList = await citiesRes.json();
  assert.ok(Array.isArray(citiesList), "Cities should be an array");
  console.log(`  ✅ [PASS] Popular cities aggregated successfully (${citiesList.length} destinations ranked)`);

  // 8. Test GET /admin/analytics/activities
  console.log("\nStep 8: Testing GET /admin/analytics/activities with admin credentials...");
  const activitiesRes = await fetch(`${API_BASE}/admin/analytics/activities?limit=5`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.strictEqual(activitiesRes.status, 200, "GET /admin/analytics/activities should succeed");
  const activitiesList = await activitiesRes.json();
  assert.ok(Array.isArray(activitiesList), "Activities should be an array");
  console.log(`  ✅ [PASS] Popular activities aggregated successfully (${activitiesList.length} activities ranked)`);

  // 9. Test GET /admin/analytics/trends
  console.log("\nStep 9: Testing GET /admin/analytics/trends with admin credentials...");
  const trendsRes = await fetch(`${API_BASE}/admin/analytics/trends`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.strictEqual(trendsRes.status, 200, "GET /admin/analytics/trends should succeed");
  const trendsList = await trendsRes.json();
  assert.ok(Array.isArray(trendsList), "Trends should be an array");
  assert.ok(trendsList.length > 0, "Trends should contain at least one time bucket");
  console.log(`  ✅ [PASS] Growth trends calculated successfully (${trendsList.length} time periods returned)`);

  console.log("\n=================================================");
  console.log("🎉 ALL ADMIN & RBAC QA TESTS PASSED: 18 Passed, 0 Failed");
  console.log("=================================================\n");
}

runAdminQASuite().catch((err) => {
  console.error("❌ Admin QA Suite Failed:", err);
  process.exit(1);
});
