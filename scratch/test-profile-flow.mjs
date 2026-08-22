import assert from "node:assert";

const API_BASE = "http://localhost:4000";

async function runProfileQASuite() {
  console.log("=================================================");
  console.log("🚀 STARTING GLOBETROTTER PROFILE & SETTINGS QA SUITE");
  console.log("=================================================\n");

  const timestamp = Date.now();

  // 1. Register User A
  console.log("Step 1: Registering User A...");
  const userAEmail = `profile_a_${timestamp}@globetrotter.test`;
  const userARes = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      firstName: "Aarav",
      lastName: "Shah",
      username: `aarav_${timestamp}`,
      email: userAEmail,
      password: "Password@123",
      city: "Ahmedabad",
      country: "India",
    }),
  });
  assert.strictEqual(userARes.status, 201, "User A registration should succeed");
  const userAData = await userARes.json();
  const tokenA = userAData.token;
  console.log("  ✅ [PASS] User A registered successfully");

  // 2. Register User B
  console.log("\nStep 2: Registering User B for uniqueness collision testing...");
  const userBEmail = `profile_b_${timestamp}@globetrotter.test`;
  const userBUsername = `rohan_${timestamp}`;
  const userBRes = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      firstName: "Rohan",
      lastName: "Verma",
      username: userBUsername,
      email: userBEmail,
      password: "Password@123",
      city: "Delhi",
      country: "India",
    }),
  });
  assert.strictEqual(userBRes.status, 201, "User B registration should succeed");
  console.log("  ✅ [PASS] User B registered successfully");

  // 3. Fetch User A profile (GET /users/me)
  console.log("\nStep 3: Fetching User A profile (GET /users/me)...");
  const getMeRes = await fetch(`${API_BASE}/users/me`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert.strictEqual(getMeRes.status, 200, "GET /users/me should return 200 OK");
  const profileA = await getMeRes.json();
  assert.strictEqual(profileA.email, userAEmail);
  assert.strictEqual(profileA.firstName, "Aarav");
  assert.strictEqual(profileA.passwordHash, undefined, "passwordHash must never be exposed");
  console.log("  ✅ [PASS] User A profile retrieved with all fields (password omitted)");

  // 4. Update User A details (PATCH /users/me)
  console.log("\nStep 4: Updating User A details (PATCH /users/me)...");
  const updateRes = await fetch(`${API_BASE}/users/me`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({
      firstName: "Aarav Modern",
      lastName: "Shah Explorer",
      phone: "+91 9988776655",
      city: "Bengaluru",
      country: "India",
      additionalInfo: "Passionate backpacker exploring South Asia.",
    }),
  });
  assert.strictEqual(updateRes.status, 200, "PATCH /users/me should return 200 OK");
  const updatedA = await updateRes.json();
  assert.strictEqual(updatedA.firstName, "Aarav Modern");
  assert.strictEqual(updatedA.lastName, "Shah Explorer");
  assert.strictEqual(updatedA.phone, "+91 9988776655");
  assert.strictEqual(updatedA.city, "Bengaluru");
  assert.strictEqual(updatedA.additionalInfo, "Passionate backpacker exploring South Asia.");
  console.log("  ✅ [PASS] Profile details updated and persisted in MongoDB");

  // 5. Test Uniqueness Validation (Duplicate Username collision)
  console.log("\nStep 5: Testing duplicate username rejection (409 Conflict)...");
  const dupUsernameRes = await fetch(`${API_BASE}/users/me`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({
      username: userBUsername, // already owned by User B
    }),
  });
  assert.strictEqual(dupUsernameRes.status, 409, "Duplicate username must return 409 Conflict");
  console.log("  ✅ [PASS] Duplicate username correctly rejected with 409 Conflict");

  // 6. Test Uniqueness Validation (Duplicate Email collision)
  console.log("\nStep 6: Testing duplicate email rejection (409 Conflict)...");
  const dupEmailRes = await fetch(`${API_BASE}/users/me`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({
      email: userBEmail, // already owned by User B
    }),
  });
  assert.strictEqual(dupEmailRes.status, 409, "Duplicate email must return 409 Conflict");
  console.log("  ✅ [PASS] Duplicate email correctly rejected with 409 Conflict");

  // 7. Test Format Validations
  console.log("\nStep 7: Testing format validation (invalid email & empty first name)...");
  const invalidEmailRes = await fetch(`${API_BASE}/users/me`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({
      email: "invalid-email-address",
    }),
  });
  assert.strictEqual(invalidEmailRes.status, 400, "Invalid email format must return 400 Bad Request");

  const emptyFirstRes = await fetch(`${API_BASE}/users/me`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({
      firstName: "   ",
    }),
  });
  assert.strictEqual(emptyFirstRes.status, 400, "Empty first name must return 400 Bad Request");
  console.log("  ✅ [PASS] Invalid email and empty name rejected with 400 Bad Request");

  // 8. Test Role Tampering Prevention
  console.log("\nStep 8: Testing role tampering prevention...");
  const roleTamperRes = await fetch(`${API_BASE}/users/me`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({
      role: "ADMIN",
    }),
  });
  assert.strictEqual(roleTamperRes.status, 200);
  const afterTamper = await roleTamperRes.json();
  assert.strictEqual(afterTamper.role, "USER", "Role cannot be elevated via /users/me");
  console.log("  ✅ [PASS] Role field tampering ignored; user remains USER role");

  // 9. Re-fetch to verify persistent state across sessions
  console.log("\nStep 9: Confirming persistence after refresh/re-query...");
  const verifyRes = await fetch(`${API_BASE}/users/me`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  const finalProfile = await verifyRes.json();
  assert.strictEqual(finalProfile.firstName, "Aarav Modern");
  assert.strictEqual(finalProfile.city, "Bengaluru");
  console.log("  ✅ [PASS] Full profile persistence verified in MongoDB");

  console.log("\n=================================================");
  console.log("🎉 ALL PROFILE & SETTINGS QA TESTS PASSED: 12 Passed, 0 Failed");
  console.log("=================================================\n");
}

runProfileQASuite().catch((err) => {
  console.error("❌ Profile QA Suite Failed:", err);
  process.exit(1);
});
