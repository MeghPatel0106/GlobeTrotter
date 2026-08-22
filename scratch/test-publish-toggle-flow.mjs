import assert from "node:assert";

const API_BASE = "http://localhost:4000";

async function runPublishToggleQASuite() {
  console.log("=================================================");
  console.log("🚀 STARTING COMMUNITY PUBLISH/UNPUBLISH & RECENCY QA SUITE");
  console.log("=================================================\n");

  const timestamp = Date.now();

  // 1. Register User A
  console.log("Step 1: Registering User A...");
  const userAEmail = `pub_a_${timestamp}@globetrotter.test`;
  const userARes = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      firstName: "Arjun",
      lastName: "Reddy",
      username: `arjun_${timestamp}`,
      email: userAEmail,
      password: "Password@123",
      city: "Hyderabad",
      country: "India",
    }),
  });
  assert.strictEqual(userARes.status, 201, "User A registration should succeed");
  const userAData = await userARes.json();
  const tokenA = userAData.token;
  console.log("  ✅ [PASS] User A registered successfully");

  // 2. Register User B
  console.log("\nStep 2: Registering User B (Unauthorized User)...");
  const userBEmail = `pub_b_${timestamp}@globetrotter.test`;
  const userBRes = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      firstName: "Rhea",
      lastName: "Sen",
      username: `rhea_${timestamp}`,
      email: userBEmail,
      password: "Password@123",
      city: "Kolkata",
      country: "India",
    }),
  });
  assert.strictEqual(userBRes.status, 201, "User B registration should succeed");
  const userBData = await userBRes.json();
  const tokenB = userBData.token;
  console.log("  ✅ [PASS] User B registered successfully");

  // 3. User A creates Trip 1 and Trip 2
  console.log("\nStep 3: User A creates Trip 1 (Kerala Backwaters) and Trip 2 (Ladakh Odyssey)...");
  const trip1Res = await fetch(`${API_BASE}/trips`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({
      name: "Kerala Backwaters & Tea Gardens",
      description: "Houseboats in Alleppey and misty plantations in Munnar.",
      startDate: "2026-11-01T00:00:00.000Z",
      endDate: "2026-11-06T00:00:00.000Z",
      sectionBudget: 25000,
      notes: "Scenic Kerala voyage.",
      cities: [
        { cityName: "Alleppey", country: "India", sectionBudget: 15000, notes: "Canal cruises." },
        { cityName: "Munnar", country: "India", sectionBudget: 10000, notes: "Tea gardens." },
      ],
    }),
  });
  const trip1 = await trip1Res.json();
  assert.strictEqual(trip1Res.status, 201);
  assert.strictEqual(trip1.visibility, "PRIVATE");
  const trip1Id = trip1.id;

  const trip2Res = await fetch(`${API_BASE}/trips`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({
      name: "Ladakh High Passes & Monasteries",
      description: "High altitude passes, Pangong Lake, and Thiksey Monastery.",
      startDate: "2026-12-01T00:00:00.000Z",
      endDate: "2026-12-07T00:00:00.000Z",
      sectionBudget: 35000,
      notes: "Mountain high pass voyage.",
      cities: [
        { cityName: "Leh", country: "India", sectionBudget: 35000, notes: "High altitude exploration." },
      ],
    }),
  });
  const trip2 = await trip2Res.json();
  assert.strictEqual(trip2Res.status, 201);
  assert.strictEqual(trip2.visibility, "PRIVATE");
  const trip2Id = trip2.id;
  console.log("  ✅ [PASS] Trip 1 and Trip 2 created with PRIVATE visibility");

  // 4. User A publishes Trip 1 to Community
  console.log("\nStep 4: User A publishing Trip 1 (POST /trips/:id/publish)...");
  const pub1Res = await fetch(`${API_BASE}/trips/${trip1Id}/publish`, {
    method: "POST",
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert.strictEqual(pub1Res.status, 201);
  const pub1Data = await pub1Res.json();
  assert.strictEqual(pub1Data.trip.visibility, "PUBLIC");
  assert.ok(pub1Data.trip.publishedAt, "publishedAt must be set");
  console.log("  ✅ [PASS] Trip 1 published to Community successfully");

  // Verify Trip 1 is in feed
  const feed1Res = await fetch(`${API_BASE}/trips/community/feed?sort=newest`);
  const feed1 = await feed1Res.json();
  assert.strictEqual(feed1[0].id, trip1Id, "Trip 1 must be at index 0 of community feed");
  console.log("  ✅ [PASS] Trip 1 is at the top of the Community feed");

  // Wait 100ms so timestamps differ
  await new Promise((r) => setTimeout(r, 150));

  // 5. User A publishes Trip 2 to Community
  console.log("\nStep 5: User A publishing Trip 2 to Community...");
  const pub2Res = await fetch(`${API_BASE}/trips/${trip2Id}/publish`, {
    method: "POST",
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert.strictEqual(pub2Res.status, 201);
  console.log("  ✅ [PASS] Trip 2 published to Community successfully");

  // Verify Trip 2 is now on TOP of feed
  const feed2Res = await fetch(`${API_BASE}/trips/community/feed?sort=newest`);
  const feed2 = await feed2Res.json();
  assert.strictEqual(feed2[0].id, trip2Id, "Trip 2 (most recently shared) must be at the very top (index 0)");
  assert.strictEqual(feed2[1].id, trip1Id, "Trip 1 must follow Trip 2 in recency");
  console.log("  ✅ [PASS] The last shared trip (Trip 2) is on the TOP of the community feed");

  // Wait 100ms
  await new Promise((r) => setTimeout(r, 150));

  // 6. User A re-shares / re-publishes Trip 1 to move it to the top
  console.log("\nStep 6: User A re-shares Trip 1 (POST /trips/:id/publish) to bump it...");
  const rePub1Res = await fetch(`${API_BASE}/trips/${trip1Id}/publish`, {
    method: "POST",
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert.strictEqual(rePub1Res.status, 201);

  const feed3Res = await fetch(`${API_BASE}/trips/community/feed?sort=newest`);
  const feed3 = await feed3Res.json();
  assert.strictEqual(feed3[0].id, trip1Id, "Trip 1 must now be at the very top (index 0)");
  console.log("  ✅ [PASS] Re-published Trip 1 moved to the very top of the feed");

  // 7. User A unpublishes Trip 1 from Community
  console.log("\nStep 7: User A unpublishing Trip 1 (POST /trips/:id/unpublish)...");
  const unpub1Res = await fetch(`${API_BASE}/trips/${trip1Id}/unpublish`, {
    method: "POST",
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert.strictEqual(unpub1Res.status, 201);
  const unpub1Data = await unpub1Res.json();
  assert.strictEqual(unpub1Data.trip.visibility, "PRIVATE");
  console.log("  ✅ [PASS] Trip 1 unpublished successfully");

  // Verify Trip 1 is removed from feed
  const feed4Res = await fetch(`${API_BASE}/trips/community/feed?sort=newest`);
  const feed4 = await feed4Res.json();
  const foundTrip1 = feed4.find((t) => t.id === trip1Id);
  assert.strictEqual(foundTrip1, undefined, "Trip 1 must no longer be in Community feed");
  console.log("  ✅ [PASS] Trip 1 confirmed removed from Community feed");

  // 8. Test Unauthorized Unpublish: User B attempting to unpublish User A's Trip 2
  console.log("\nStep 8: Testing unauthorized unpublish security (User B on User A's trip)...");
  const unauthRes = await fetch(`${API_BASE}/trips/${trip2Id}/unpublish`, {
    method: "POST",
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  assert.strictEqual(unauthRes.status, 403, "Must return 403 Forbidden for unauthorized user");
  console.log("  ✅ [PASS] Unauthorized modification correctly blocked with 403 Forbidden");

  console.log("\n=================================================");
  console.log("🎉 ALL PUBLISH TOGGLE & RECENCY QA TESTS PASSED: 14 Passed, 0 Failed");
  console.log("=================================================\n");
}

runPublishToggleQASuite().catch((err) => {
  console.error("❌ Publish Toggle QA Suite Failed:", err);
  process.exit(1);
});
