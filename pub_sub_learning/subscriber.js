// subscriber.js
import { createClient } from "redis";

const subscriber = createClient();
await subscriber.connect();

await subscriber.subscribe("BTC_PRICE", (message) => {
  console.log("Received BTC_PRICE:", message);
});
