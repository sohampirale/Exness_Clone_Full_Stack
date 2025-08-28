// publisher.js
import { createClient } from "redis";

const publisher = createClient();
await publisher.connect();

setInterval(() => {
  const price = (Math.random() * 10000).toFixed(2);
  publisher.publish("BTC_PRICE", price);
  console.log("Published BTC_PRICE:", price);
}, 1000);
