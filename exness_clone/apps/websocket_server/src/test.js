// test-client.js
import WebSocket from "ws";

const url = "wss://urban-palm-tree-v6wx5766vxq3w696-3002.app.github.dev/";

console.log("Connecting to:", url);

const ws = new WebSocket(url);

ws.on("open", () => {
  console.log("✅ Connected to server");
  ws.send("Hello from Node.js client!");
});

ws.on("message", (msg) => {
  console.log("📩 Message from server:", msg.toString());
});

ws.on("error", (err) => {
  console.error("❌ WebSocket error:", err);
});

ws.on("close", () => {
  console.log("❌ Connection closed");
});
