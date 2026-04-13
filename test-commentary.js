const WebSocket = require("ws");
const http = require("http");

// Simple test script for commentary broadcasting
async function testCommentaryBroadcasting() {
  console.log("🧪 Testing Commentary Broadcasting\n");

  try {
    // Check if server is running
    console.log("🔍 Checking if server is running...");
    try {
      const healthCheck = await fetch("http://localhost:8000/");
      if (!healthCheck.ok) {
        throw new Error("Server not responding");
      }
      console.log("✅ Server is running");
    } catch (error) {
      console.error(
        "❌ Server is not running. Please start it with: npm run dev",
      );
      process.exit(1);
    }

    // Step 1: Login to get token
    console.log("1️⃣ Logging in...");
    const loginResponse = await fetch("http://localhost:8000/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: "test-user", email: "test@example.com" }),
    });

    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      throw new Error(`Login failed: ${loginResponse.status} - ${errorText}`);
    }

    const loginData = await loginResponse.json();
    const { token } = loginData;
    console.log("✅ Got JWT token:", token ? "Present" : "Missing");

    // Step 2: Create a match
    console.log("2️⃣ Creating match...");
    const matchResponse = await fetch("http://localhost:8000/matches", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        sport: "football",
        homeTeam: "Test Team A",
        awayTeam: "Test Team B",
        startTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
        endTime: new Date(Date.now() + 7200000).toISOString(), // 2 hours from now
      }),
    });

    if (!matchResponse.ok) {
      throw new Error(`Match creation failed: ${matchResponse.status}`);
    }

    const { data: match } = await matchResponse.json();
    console.log(`✅ Created match with ID: ${match.id}`);

    // Step 3: Connect to WebSocket and subscribe
    console.log("3️⃣ Connecting to WebSocket...");
    const ws = new WebSocket(`ws://localhost:8000/ws?token=${token}`);

    ws.on("open", () => {
      console.log("✅ WebSocket connected");
      console.log("📡 Subscribing to match...");
      ws.send(JSON.stringify({ type: "subscribe", matchId: match.id }));
    });

    ws.on("message", (data) => {
      const message = JSON.parse(data.toString());
      console.log("📨 Received:", message);

      if (message.type === "subscribed") {
        console.log("✅ Subscribed to match, now creating commentary...");

        // Step 4: Create commentary
        setTimeout(async () => {
          console.log("4️⃣ Creating commentary...");
          try {
            const commentaryResponse = await fetch(
              `http://localhost:8000/matches/${match.id}/commentary`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  minutes: 45,
                  message: "Amazing goal from midfield!",
                  eventType: "goal",
                  actor: "Test Player",
                  team: "Test Team A",
                  period: "2nd half",
                }),
              },
            );

            if (!commentaryResponse.ok) {
              console.error(
                "❌ Commentary creation failed:",
                commentaryResponse.status,
              );
            } else {
              const { data: commentary } = await commentaryResponse.json();
              console.log("✅ Commentary created:", commentary.message);
            }
          } catch (error) {
            console.error("❌ Error creating commentary:", error.message);
          }
        }, 1000);
      }

      if (message.type === "commentary") {
        console.log("🎉 SUCCESS: Commentary broadcast received!");
        console.log("📝 Commentary data:", message.data);
        ws.close();
        process.exit(0);
      }
    });

    ws.on("error", (error) => {
      console.error("❌ WebSocket error:", error.message);
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      console.error("❌ Test timeout - no broadcast received");
      ws.close();
      process.exit(1);
    }, 10000);
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    process.exit(1);
  }
}

testCommentaryBroadcasting();
