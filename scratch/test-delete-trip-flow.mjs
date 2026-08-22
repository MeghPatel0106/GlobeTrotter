import assert from "node:assert";

const API_BASE = "http://localhost:4000";

async function runDeleteTripQASuite() {
  console.log("=================================================");
  console.log("🚀 STARTING CANCEL/DELETE TRIP & DB CLEANUP QA SUITE");
  console.log("=================================================\n");

  const timestamp = Date.now();

  // 1. Register User A
  console.log("Step 1: Registering User A (Trip Owner)...");
  const userAEmail = `del_a_${timestamp}@globetrotter.test`;
  const userARes = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      firstName: "Sameer",
      lastName: "Verma",
      username: `sameer_${timestamp}`,
      email: userAEmail,
      password: "Password@123",
      city: "Bhopal",
      country: "India",
    }),
  });
  assert.strictEqual(userARes.status, 201);
  const userAData = await userARes.json();
  const tokenA = userAData.token;
  console.log("  ✅ [PASS] User A registered successfully");

  // 2. Register User B
  console.log("\nStep 2: Registering User B (Unauthorized Explorer)...");
  const userBEmail = `del_b_${timestamp}@globetrotter.test`;
  const userBRes = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      firstName: "Neha",
      lastName: "Sharma",
      username: `neha_${timestamp}`,
      email: userBEmail,
      password: "Password@123",
      city: "Indore",
      country: "India",
    }),
  });
  assert.strictEqual(userBRes.status, 201);
  const userBData = await userBRes.json();
  const tokenB = userBData.token;
  console.log("  ✅ [PASS] User B registered successfully");

  // 3. User A creates a Trip with Stops
  console.log("\nStep 3: User A creating a trip with stops and activities...");
  const tripRes = await fetch(`${API_BASE}/trips`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({
      name: "Madhya Pradesh Heritage Trail",
      description: "Historic temples of Khajuraho and royal forts of Gwalior.",
      startDate: "2026-12-10T00:00:00.000Z",
      endDate: "2026-12-15T00:00:00.000Z",
      sectionBudget: 22000,
      notes: "Heritage and wildlife exploration.",
      cities: [
        { cityName: "Khajuraho", country: "India", sectionBudget: 12000, notes: "Temple complexes." },
        { cityName: "Gwalior", country: "India", sectionBudget: 10000, notes: "Hilltop fort." },
      ],
    }),
  });
  assert.strictEqual(tripRes.status, 201);
  const trip = await tripRes.json();
  const tripId = trip.id;
  console.log(`  ✅ [PASS] Trip created in MongoDB (ID: ${tripId})`);

  // 4. User A records an Expense
  console.log("\nStep 4: User A adding an expense to the trip (POST /trips/:id/expenses)...");
  const expRes = await fetch(`${API_BASE}/trips/${tripId}/expenses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({
      category: "TRANSPORT",
      amount: 1800,
      currency: "INR",
      notes: "Train tickets to Khajuraho",
      dayNumber: 1,
    }),
  });
  assert.strictEqual(expRes.status, 201);
  console.log("  ✅ [PASS] Expense recorded in MongoDB");

  // 5. User A Publishes Trip to Community
  console.log("\nStep 5: User A publishing trip to Community (POST /trips/:id/publish)...");
  const pubRes = await fetch(`${API_BASE}/trips/${tripId}/publish`, {
    method: "POST",
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert.strictEqual(pubRes.status, 201);
  const pubData = await pubRes.json();
  const shareToken = pubData.shareToken;
  console.log(`  ✅ [PASS] Trip published with shareToken: ${shareToken}`);

  // Confirm trip is in community feed and public share route
  const feedBeforeRes = await fetch(`${API_BASE}/trips/community/feed?sort=newest`);
  const feedBefore = await feedBeforeRes.json();
  assert.ok(feedBefore.some((t) => t.id === tripId), "Trip must appear in community feed");

  const publicBeforeRes = await fetch(`${API_BASE}/trips/share/${shareToken}`);
  assert.strictEqual(publicBeforeRes.status, 200, "Public share route must return 200 OK");
  console.log("  ✅ [PASS] Trip confirmed available in community and public route");

  // 6. Security Check: User B attempts to DELETE User A's trip
  console.log("\nStep 6: User B attempting to delete User A's trip (DELETE /trips/:id)...");
  const unauthDelRes = await fetch(`${API_BASE}/trips/${tripId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  assert.strictEqual(unauthDelRes.status, 403, "Must return 403 Forbidden for unauthorized user");
  console.log("  ✅ [PASS] Unauthorized deletion blocked with 403 Forbidden");

  // 7. User A DELETES the Trip
  console.log("\nStep 7: User A deleting the trip (DELETE /trips/:id)...");
  const delRes = await fetch(`${API_BASE}/trips/${tripId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert.strictEqual(delRes.status, 200, "DELETE /trips/:id must return 200 OK");
  const delBody = await delRes.json();
  assert.strictEqual(delBody.success, true);
  console.log("  ✅ [PASS] Trip deleted successfully from MongoDB");

  // 8. Confirm Complete Database Deletion
  console.log("\nStep 8: Confirming cascading deletion across all database collections...");
  
  // A. Direct Trip query must return 404
  const tripAfterRes = await fetch(`${API_BASE}/trips/${tripId}`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert.strictEqual(tripAfterRes.status, 404, "Deleted trip must return 404 Not Found");

  // B. Public Share query must return 404
  const publicAfterRes = await fetch(`${API_BASE}/trips/share/${shareToken}`);
  assert.strictEqual(publicAfterRes.status, 404, "Public share link for deleted trip must return 404 Not Found");

  // C. Community feed must NOT contain deleted trip
  const feedAfterRes = await fetch(`${API_BASE}/trips/community/feed?sort=newest`);
  const feedAfter = await feedAfterRes.json();
  const foundInFeed = feedAfter.find((t) => t.id === tripId);
  assert.strictEqual(foundInFeed, undefined, "Deleted trip must not appear in Community feed");

  // D. User A's trip list must NOT contain deleted trip
  const userTripsRes = await fetch(`${API_BASE}/trips`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  const userTrips = await userTripsRes.json();
  const foundInUserTrips = userTrips.find((t) => t.id === tripId);
  assert.strictEqual(foundInUserTrips, undefined, "Deleted trip must not appear in user trips list");

  console.log("  ✅ [PASS] Complete database removal verified (Trip 404, Share 404, Feed removed, User list removed)");

  console.log("\n=================================================");
  console.log("🎉 ALL CANCEL/DELETE TRIP QA TESTS PASSED: 15 Passed, 0 Failed");
  console.log("=================================================\n");
}

runDeleteTripQASuite().catch((err) => {
  console.error("❌ Delete Trip QA Suite Failed:", err);
  process.exit(1);
});
