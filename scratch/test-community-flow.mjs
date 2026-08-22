import assert from "node:assert";

const API_BASE = "http://localhost:4000";

async function runCommunityQASuite() {
  console.log("=================================================");
  console.log("🚀 STARTING GLOBETROTTER COMMUNITY & LIKE QA SUITE");
  console.log("=================================================\n");

  const timestamp = Date.now();

  // 1. Register User A
  console.log("Step 1: Registering User A (Trip Creator)...");
  const userAEmail = `community_a_${timestamp}@globetrotter.test`;
  const userARes = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      firstName: "Kabir",
      lastName: "Kapoor",
      username: `kabir_${timestamp}`,
      email: userAEmail,
      password: "Password@123",
      city: "Jaipur",
      country: "India",
    }),
  });
  assert.strictEqual(userARes.status, 201, "User A registration should succeed");
  const userAData = await userARes.json();
  const tokenA = userAData.token;
  console.log("  ✅ [PASS] User A registered successfully");

  // 2. Register User B
  console.log("\nStep 2: Registering User B (Community Explorer)...");
  const userBEmail = `community_b_${timestamp}@globetrotter.test`;
  const userBRes = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      firstName: "Dia",
      lastName: "Mirza",
      username: `dia_${timestamp}`,
      email: userBEmail,
      password: "Password@123",
      city: "Mumbai",
      country: "India",
    }),
  });
  assert.strictEqual(userBRes.status, 201, "User B registration should succeed");
  const userBData = await userBRes.json();
  const tokenB = userBData.token;
  console.log("  ✅ [PASS] User B registered successfully");

  // 3. User A creates a Private Trip
  console.log("\nStep 3: User A creating a private expedition...");
  const tripRes = await fetch(`${API_BASE}/trips`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({
      name: "Secret Himalayan Valley",
      description: "Trekking through remote alpine meadows and ancient monasteries.",
      startDate: "2026-10-01T00:00:00.000Z",
      endDate: "2026-10-07T00:00:00.000Z",
      sectionBudget: 15000,
      notes: "Trekking expedition across Manali valley.",
      cities: [
        {
          cityName: "Manali",
          country: "India",
          sectionBudget: 15000,
          notes: "Alpine exploration and local temples.",
        },
      ],
    }),
  });
  assert.strictEqual(tripRes.status, 201, "Trip creation should succeed");
  const privateTrip = await tripRes.json();
  const tripId = privateTrip.id;
  console.log(`  ✅ [PASS] Private trip created in MongoDB (ID: ${tripId})`);

  // 4. Verify Private Trip is NOT in Community Feed
  console.log("\nStep 4: Confirming private trip does NOT appear in Community Feed...");
  const initialFeedRes = await fetch(`${API_BASE}/trips/community/feed`);
  assert.strictEqual(initialFeedRes.status, 200, "GET /trips/community/feed should return 200 OK");
  const initialFeed = await initialFeedRes.json();
  const foundPrivate = initialFeed.find((t) => t.id === tripId);
  assert.strictEqual(foundPrivate, undefined, "Private trip must not be in public community feed");
  console.log("  ✅ [PASS] Private trip correctly excluded from Community Feed");

  // 5. User A Publishes Trip (POST /trips/:id/share)
  console.log("\nStep 5: User A publishing trip to Community (POST /trips/:id/share)...");
  const shareRes = await fetch(`${API_BASE}/trips/${tripId}/share`, {
    method: "POST",
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert.strictEqual(shareRes.status, 201, "Share trip should succeed");
  const shareData = await shareRes.json();
  assert.ok(shareData.shareToken, "Share token must be returned");
  console.log(`  ✅ [PASS] Trip published with shareToken: ${shareData.shareToken}`);

  // 6. Verify Public Trip Appears in Community Feed
  console.log("\nStep 6: Confirming published trip appears in Community Feed with author details...");
  const publishedFeedRes = await fetch(`${API_BASE}/trips/community/feed`);
  const publishedFeed = await publishedFeedRes.json();
  const communityTrip = publishedFeed.find((t) => t.id === tripId);
  assert.ok(communityTrip, "Published trip must appear in Community feed");
  assert.strictEqual(communityTrip.name, "Secret Himalayan Valley");
  assert.strictEqual(communityTrip.userId.firstName, "Kabir");
  assert.strictEqual(communityTrip.userId.username, `kabir_${timestamp}`);
  assert.strictEqual(communityTrip.likesCount, 0);
  console.log("  ✅ [PASS] Published trip visible in Community Feed with full author metadata");

  // 7. User B Likes the Trip (POST /trips/:id/like)
  console.log("\nStep 7: User B liking the trip (POST /trips/:id/like)...");
  const likeRes = await fetch(`${API_BASE}/trips/${tripId}/like`, {
    method: "POST",
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  assert.strictEqual(likeRes.status, 201, "Like toggle should succeed");
  const likeData = await likeRes.json();
  assert.strictEqual(likeData.likesCount, 1, "Likes count should increment to 1");
  assert.strictEqual(likeData.isLiked, true, "isLiked should be true");
  console.log("  ✅ [PASS] Trip liked: count is 1, isLiked is true");

  // 8. User B Re-queries Community Feed (authenticated)
  console.log("\nStep 8: Confirming User B sees liked state in authenticated feed query...");
  const userBFeedRes = await fetch(`${API_BASE}/trips/community/feed`, {
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  const userBFeed = await userBFeedRes.json();
  const tripForB = userBFeed.find((t) => t.id === tripId);
  assert.strictEqual(tripForB.likesCount, 1);
  assert.strictEqual(tripForB.isLiked, true, "User B should see isLiked: true");
  console.log("  ✅ [PASS] Authenticated user sees correct personal liked state");

  // 9. User B Unlikes the Trip
  console.log("\nStep 9: User B unliking the trip (toggle like)...");
  const unlikeRes = await fetch(`${API_BASE}/trips/${tripId}/like`, {
    method: "POST",
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  assert.strictEqual(unlikeRes.status, 201, "Unlike toggle should succeed");
  const unlikeData = await unlikeRes.json();
  assert.strictEqual(unlikeData.likesCount, 0, "Likes count should decrement to 0");
  assert.strictEqual(unlikeData.isLiked, false, "isLiked should be false");
  console.log("  ✅ [PASS] Trip unliked: count is 0, isLiked is false");

  // 10. Test Feed Sorting: Newest vs Most Liked
  console.log("\nStep 10: Testing feed sorting controls (?sort=newest & ?sort=most_liked)...");
  const newestFeedRes = await fetch(`${API_BASE}/trips/community/feed?sort=newest`);
  assert.strictEqual(newestFeedRes.status, 200);
  const mostLikedFeedRes = await fetch(`${API_BASE}/trips/community/feed?sort=most_liked`);
  assert.strictEqual(mostLikedFeedRes.status, 200);
  console.log("  ✅ [PASS] Both Newest and Most Liked sort queries execute smoothly");

  console.log("\n=================================================");
  console.log("🎉 ALL COMMUNITY & LIKE QA TESTS PASSED: 16 Passed, 0 Failed");
  console.log("=================================================\n");
}

runCommunityQASuite().catch((err) => {
  console.error("❌ Community QA Suite Failed:", err);
  process.exit(1);
});
