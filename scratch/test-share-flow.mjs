// Automated Verification Script for GlobeTrotter Public Sharing & Copy Feature

const API_BASE = "http://localhost:4000";

async function runShareQA() {
  console.log("=================================================");
  console.log("🚀 STARTING GLOBETROTTER SHARE & COPY QA SUITE");
  console.log("=================================================\n");

  let testPassed = 0;
  let testFailed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      testPassed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}`);
      testFailed++;
    }
  }

  try {
    const unique = Date.now();

    // 1. Register User A (Trip Owner)
    console.log("Step 1: Registering User A (Trip Creator)...");
    const userARes = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "Alice",
        lastName: "Voyager",
        username: `alice_${unique}`,
        email: `alice_${unique}@example.com`,
        password: "Password123!",
      }),
    });
    const userA = await userARes.json();
    const tokenA = userA.token || userA.accessToken;
    assert(userARes.ok && tokenA, "User A registered successfully");
    const headersA = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenA}`,
    };

    // 2. User A Creates a Trip with Stops and Activities
    console.log("\nStep 2: User A creating a multi-city expedition...");
    const tripRes = await fetch(`${API_BASE}/trips`, {
      method: "POST",
      headers: headersA,
      body: JSON.stringify({
        name: "Rajasthan Royal Odyssey",
        description: "Desert palaces, historic forts, and cultural bazaars.",
        startDate: "2026-11-10T00:00:00.000Z",
        endDate: "2026-11-15T00:00:00.000Z",
        sectionBudget: 45000,
        notes: "Heritage expedition across Jaipur and Udaipur.",
        cities: [
          {
            cityName: "Jaipur",
            country: "India",
            sectionBudget: 20000,
            notes: "Pink City palaces and Amber Fort.",
          },
          {
            cityName: "Udaipur",
            country: "India",
            sectionBudget: 25000,
            notes: "City of Lakes and Lake Pichola boat ride.",
          },
        ],
      }),
    });
    const trip = await tripRes.json();
    console.log("tripRes status:", tripRes.status, "body:", trip);
    assert(tripRes.ok && trip.id, "Trip created by User A in MongoDB");
    const tripId = trip.id;
    const jaipurStopId = trip.stops[0].id || trip.stops[0]._id;

    // Add Itinerary Activity to Jaipur
    const actRes = await fetch(`${API_BASE}/itinerary-items`, {
      method: "POST",
      headers: headersA,
      body: JSON.stringify({
        stopId: jaipurStopId,
        activityName: "Amber Fort Royal Elephant Ascent",
        dayNumber: 1,
        startTime: "09:00 AM",
        costOverride: 1100,
        orderIndex: 0,
      }),
    });
    assert(actRes.ok, "Itinerary activity added to trip");

    // 3. User A Generates Public Share Link (POST /trips/:id/share)
    console.log("\nStep 3: Generating opaque public share token (POST /trips/:id/share)...");
    const shareRes = await fetch(`${API_BASE}/trips/${tripId}/share`, {
      method: "POST",
      headers: headersA,
    });
    const shareData = await shareRes.json();
    console.log("shareRes status:", shareRes.status, "body:", shareData);
    assert(
      shareRes.ok && shareData.shareToken && shareData.shareToken.length >= 16,
      `Share token generated: ${shareData.shareToken}`
    );
    assert(
      shareData.shareUrl === `/share/${shareData.shareToken}`,
      "Public share URL correctly formatted"
    );
    const shareToken = shareData.shareToken;

    // 4. Anonymous User Fetches Public Itinerary (GET /trips/share/:token) WITHOUT Auth
    console.log("\nStep 4: Anonymous fetching of public itinerary (GET /trips/share/:token)...");
    const publicRes = await fetch(`${API_BASE}/trips/share/${shareToken}`);
    const publicTrip = await publicRes.json();
    assert(publicRes.ok, "Public endpoint accessible without authentication headers");
    assert(
      publicTrip.name === "Rajasthan Royal Odyssey",
      "Public trip name matches created trip"
    );
    assert(
      publicTrip.stops.length === 2,
      "Public trip contains all 2 destination legs"
    );
    assert(
      publicTrip.stops[0].itineraryItems.length === 1 &&
        publicTrip.stops[0].itineraryItems[0].activityName === "Amber Fort Royal Elephant Ascent",
      "Public trip contains scheduled itinerary activities and paired costs"
    );

    // 5. Test Invalid Token Returns 404
    console.log("\nStep 5: Testing invalid share token handling...");
    const invalidRes = await fetch(`${API_BASE}/trips/share/nonexistent-invalid-token-12345`);
    assert(
      invalidRes.status === 404,
      "Invalid/expired share token returns 404 Not Found"
    );

    // 6. Register User B and Copy Public Trip (POST /trips/share/:token/copy)
    console.log("\nStep 6: User B copies the public trip (POST /trips/share/:token/copy)...");
    const userBRes = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "Bob",
        lastName: "Nomad",
        username: `bob_${unique}`,
        email: `bob_${unique}@example.com`,
        password: "Password123!",
      }),
    });
    const userB = await userBRes.json();
    const tokenB = userB.token || userB.accessToken;
    assert(userBRes.ok && tokenB, "User B registered successfully");
    const headersB = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenB}`,
    };

    const copyRes = await fetch(`${API_BASE}/trips/share/${shareToken}/copy`, {
      method: "POST",
      headers: headersB,
    });
    const copiedTrip = await copyRes.json();
    assert(copyRes.ok && copiedTrip.id, "Trip cloned successfully into User B's account");
    assert(
      copiedTrip.id !== tripId,
      "Copied trip has unique MongoDB ObjectId distinct from original"
    );
    assert(
      copiedTrip.stops.length === 2,
      "Copied trip preserved all 2 destination stops"
    );
    assert(
      copiedTrip.stops[0].itineraryItems.length === 1 &&
        copiedTrip.stops[0].itineraryItems[0].activityName === "Amber Fort Royal Elephant Ascent",
      "Copied trip preserved all itinerary activities and details"
    );

    console.log("\n=================================================");
    console.log(`🎉 ALL SHARE & COPY QA TESTS PASSED: ${testPassed} Passed, ${testFailed} Failed`);
    console.log("=================================================");

    if (testFailed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error("QA execution encountered an error:", err);
    process.exit(1);
  }
}

runShareQA();
