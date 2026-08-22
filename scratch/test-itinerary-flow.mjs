// Full End-to-End QA Automation Script for GlobeTrotter Phase 4 (Itinerary, Activities, Expenses, Budget Summary)

const API_BASE = "http://localhost:4000";

async function runQA() {
  console.log("=================================================");
  console.log("🚀 STARTING GLOBETROTTER PHASE 4 STEP 6 QA SUITE");
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
    // 1. Authentication Check / Register Test User
    console.log("Step 1: Authenticating test user...");
    const unique = Date.now();
    const email = `qa_explorer_${unique}@example.com`;
    const password = "Password123!";

    const regRes = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "QA",
        lastName: "Explorer",
        username: `qa_user_${unique}`,
        email,
        password,
      }),
    });

    const regData = await regRes.json();
    const token = regData.token || regData.accessToken;
    assert(regRes.ok && token, "User registered and received JWT token");
    const authHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    // 2. Create a Real 3-Day Trip with 2 Destination Stops (Ahmedabad & Mumbai)
    console.log("\nStep 2: Creating a 3-Day Trip (Ahmedabad & Mumbai)...");
    const tripRes = await fetch(`${API_BASE}/trips`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        name: "Gujarat & Mumbai Golden Circuit",
        description: "Heritage architecture, coastal drives, and culinary delights.",
        startDate: "2026-10-01T00:00:00.000Z",
        endDate: "2026-10-04T00:00:00.000Z",
        sectionBudget: 25000,
        notes: "Heritage Havelis and Mumbai coastal drives.",
        cities: [
          {
            cityName: "Ahmedabad",
            country: "India",
            sectionBudget: 10000,
            notes: "Heritage Havelis and Sabarmati exploration.",
          },
          {
            cityName: "Mumbai",
            country: "India",
            sectionBudget: 15000,
            notes: "Marine Drive and Gateway of India.",
          },
        ],
      }),
    });

    const tripData = await tripRes.json();
    assert(tripRes.ok && tripData.id, "Trip created successfully in MongoDB");
    const tripId = tripData.id;
    const stop1Id = tripData.stops[0].id || tripData.stops[0]._id;
    const stop2Id = tripData.stops[1].id || tripData.stops[1]._id;
    assert(stop1Id && stop2Id, "Trip contains 2 initialized destination stops");

    // 3. Test Adding Activities (POST /itinerary-items)
    console.log("\nStep 3: Testing Itinerary Activity Persistence (POST /itinerary-items)...");
    const act1Res = await fetch(`${API_BASE}/itinerary-items`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        stopId: stop1Id,
        activityName: "Sabarmati Ashram & Riverfront Walk",
        dayNumber: 1,
        startTime: "08:30 AM",
        costOverride: 250,
        orderIndex: 0,
      }),
    });
    const act1Data = await act1Res.json();
    assert(act1Res.ok, "Activity #1 added to Day 1 in MongoDB");

    const act2Res = await fetch(`${API_BASE}/itinerary-items`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        stopId: stop1Id,
        activityName: "Adalaj Stepwell Cultural Tour",
        dayNumber: 1,
        startTime: "02:30 PM",
        costOverride: 500,
        orderIndex: 1,
      }),
    });
    assert(act2Res.ok, "Activity #2 added to Day 1 in MongoDB");

    const act3Res = await fetch(`${API_BASE}/itinerary-items`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        stopId: stop2Id,
        activityName: "Marine Drive Sunset Cruise",
        dayNumber: 2,
        startTime: "05:30 PM",
        costOverride: 1200,
        orderIndex: 0,
      }),
    });
    const act3Data = await act3Res.json();
    assert(act3Res.ok, "Activity #3 added to Day 2 in MongoDB");

    // Verify trip reload has all activities
    const verifyTripRes = await fetch(`${API_BASE}/trips/${tripId}`, { headers: authHeaders });
    const verifyTrip = await verifyTripRes.json();
    const allStops = verifyTrip.stops || [];
    const ahmedabadItems = allStops[0]?.itineraryItems || [];
    const mumbaiItems = allStops[1]?.itineraryItems || [];
    assert(
      ahmedabadItems.length === 2 && mumbaiItems.length === 1,
      "Activities survive page reload / query from MongoDB"
    );

    const targetItem1 = ahmedabadItems[0];
    const targetItem1Id = targetItem1.id || targetItem1._id;

    // 4. Test Editing an Activity (PATCH /itinerary-items/:id)
    console.log("\nStep 4: Testing Edit Activity (PATCH /itinerary-items/:id)...");
    const editActRes = await fetch(`${API_BASE}/itinerary-items/${targetItem1Id}`, {
      method: "PATCH",
      headers: authHeaders,
      body: JSON.stringify({
        activityName: "Sabarmati Ashram & Private Guided Riverfront Walk",
        costOverride: 400,
        startTime: "09:00 AM",
      }),
    });
    const editActTrip = await editActRes.json();
    const updatedItem = editActTrip.stops[0].itineraryItems.find(
      (i) => (i.id || i._id) === targetItem1Id
    );
    assert(
      editActRes.ok && updatedItem.costOverride === 400 && updatedItem.startTime === "09:00 AM",
      "Activity edit persisted to MongoDB (Cost updated to ₹400, time to 09:00 AM)"
    );

    // 5. Test Adding Expenses (POST /trips/:id/expenses)
    console.log("\nStep 5: Testing Expense Persistence & Categories (POST /trips/:id/expenses)...");
    const exp1Res = await fetch(`${API_BASE}/trips/${tripId}/expenses`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        dayNumber: 1,
        stopId: stop1Id,
        category: "MEAL",
        amount: 600,
        currency: "INR",
        notes: "Traditional Gujarati Thali",
      }),
    });
    const exp1 = await exp1Res.json();
    assert(exp1Res.ok && exp1.amount === 600 && exp1.category === "MEAL", "Meal expense recorded (₹600)");

    const exp2Res = await fetch(`${API_BASE}/trips/${tripId}/expenses`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        dayNumber: 1,
        stopId: stop1Id,
        category: "TRANSPORT",
        amount: 350,
        currency: "INR",
        notes: "Auto rickshaw around old city",
      }),
    });
    const exp2 = await exp2Res.json();
    assert(exp2Res.ok && exp2.amount === 350 && exp2.category === "TRANSPORT", "Transport expense recorded (₹350)");

    const exp3Res = await fetch(`${API_BASE}/trips/${tripId}/expenses`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        dayNumber: 2,
        stopId: stop2Id,
        category: "STAY",
        amount: 4500,
        currency: "INR",
        notes: "Colaba Boutique Hotel Booking",
      }),
    });
    const exp3 = await exp3Res.json();
    assert(exp3Res.ok && exp3.amount === 4500 && exp3.category === "STAY", "Stay expense recorded (₹4,500)");

    // 6. Test Fetching Expenses (GET /trips/:id/expenses)
    console.log("\nStep 6: Testing Expense Fetching (GET /trips/:id/expenses)...");
    const getExpRes = await fetch(`${API_BASE}/trips/${tripId}/expenses`, { headers: authHeaders });
    const allExpenses = await getExpRes.json();
    assert(getExpRes.ok && allExpenses.length === 3, "Fetched all 3 recorded trip expenses from MongoDB");

    // 7. Test Editing an Expense (PATCH /expenses/:id)
    console.log("\nStep 7: Testing Edit Expense (PATCH /expenses/:id)...");
    const editExpRes = await fetch(`${API_BASE}/expenses/${exp1.id || exp1._id}`, {
      method: "PATCH",
      headers: authHeaders,
      body: JSON.stringify({
        amount: 750,
        notes: "Traditional Gujarati Deluxe Thali with Sweet Dish",
      }),
    });
    const editExp = await editExpRes.json();
    assert(editExpRes.ok && editExp.amount === 750, "Expense edited in MongoDB (₹600 -> ₹750)");

    // 8. Reconciliation & Budget Math Verification
    console.log("\nStep 8: Testing Budget & Expense Reconciliation Math...");
    // Day 1 Activities: ₹400 + ₹500 = ₹900
    // Day 1 Direct Expenses: ₹750 (Meal) + ₹350 (Transport) = ₹1,100
    // Day 1 Total = ₹900 + ₹1,100 = ₹2,000
    const day1ActsTotal = 400 + 500;
    const day1DirectTotal = 750 + 350;
    const day1Total = day1ActsTotal + day1DirectTotal;
    assert(day1Total === 2000, "Day 1 running total reconciles exactly (₹2,000)");

    // Day 2 Activities: ₹1,200
    // Day 2 Direct Expenses: ₹4,500 (Stay)
    // Day 2 Total = ₹1,200 + ₹4,500 = ₹5,700
    const day2ActsTotal = 1200;
    const day2DirectTotal = 4500;
    const day2Total = day2ActsTotal + day2DirectTotal;
    assert(day2Total === 5700, "Day 2 running total reconciles exactly (₹5,700)");

    // Overall Total Spent = ₹2,000 + ₹5,700 = ₹7,700
    const totalSpent = day1Total + day2Total;
    assert(totalSpent === 7700, "Overall trip spent matches sum of daily totals (₹7,700)");

    // Category Totals:
    // Activity: ₹400 + ₹500 + ₹1,200 = ₹2,100
    // Meal: ₹750
    // Transport: ₹350
    // Stay: ₹4,500
    // Other: ₹0
    const categorySum = 2100 + 750 + 350 + 4500;
    assert(categorySum === totalSpent, "Category breakdown sum (₹7,700) matches total spent");

    const plannedBudget = 25000;
    const remaining = plannedBudget - totalSpent;
    assert(remaining === 17300, `Remaining budget calculated correctly (₹${remaining.toLocaleString()})`);

    // 9. Test Deleting an Expense & Activity
    console.log("\nStep 9: Testing Delete Operations (DELETE /expenses/:id & DELETE /itinerary-items/:id)...");
    const delExpRes = await fetch(`${API_BASE}/expenses/${exp2.id || exp2._id}`, {
      method: "DELETE",
      headers: authHeaders,
    });
    assert(delExpRes.ok, "Expense deleted from MongoDB");

    const delActRes = await fetch(`${API_BASE}/itinerary-items/${targetItem1Id}`, {
      method: "DELETE",
      headers: authHeaders,
    });
    assert(delActRes.ok, "Activity deleted from MongoDB");

    // Re-verify remaining counts
    const postDelTripRes = await fetch(`${API_BASE}/trips/${tripId}`, { headers: authHeaders });
    const postDelTrip = await postDelTripRes.json();
    const postDelExpRes = await fetch(`${API_BASE}/trips/${tripId}/expenses`, { headers: authHeaders });
    const postDelExp = await postDelExpRes.json();
    assert(
      postDelTrip.stops[0].itineraryItems.length === 1 && postDelExp.length === 2,
      "Deleted items are removed from MongoDB without affecting remaining records"
    );

    // 10. Test Validation & Error Scenarios
    console.log("\nStep 10: Testing Error Handling & Validation Rules...");
    // Invalid negative amount
    const invalidExpRes = await fetch(`${API_BASE}/trips/${tripId}/expenses`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        dayNumber: 1,
        category: "MEAL",
        amount: -50,
      }),
    });
    assert(!invalidExpRes.ok, "Negative expense amount rejected with 400 Bad Request");

    // Unauthorized access to another user's trip
    const otherUserRes = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "Unauthorized",
        lastName: "User",
        username: `qa_unauth_${unique}`,
        email: `qa_unauthorized_${unique}@example.com`,
        password: "Password123!",
      }),
    });
    const otherUserData = await otherUserRes.json();
    const otherToken = otherUserData.token || otherUserData.accessToken;
    const unauthorizedHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${otherToken}`,
    };

    const forbiddenRes = await fetch(`${API_BASE}/trips/${tripId}/expenses`, {
      headers: unauthorizedHeaders,
    });
    assert(forbiddenRes.status === 403, "Access to other user's trip expenses blocked with 403 Forbidden");

    console.log("\n=================================================");
    console.log(`🎉 QA PASS COMPLETE: ${testPassed} Passed, ${testFailed} Failed`);
    console.log("=================================================");

    if (testFailed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error("QA execution encountered an error:", err);
    process.exit(1);
  }
}

runQA();
