import cron from "node-cron";

//per minute
cron.schedule("0 * * * * *", () => {
  console.log("Every 1 minute:", new Date().toISOString());
  // refresh_continuous_aggregate('candles_1m', ...)
});


// 30 seconds
cron.schedule("0,30 * * * * *", () => {
  console.log("Running at", new Date().toISOString());
  // Call your refresh function here
});

//5 minutes
cron.schedule("0 */5 * * * *", () => {
  console.log("Every 5 minutes:", new Date().toISOString());
  // refresh_continuous_aggregate('candles_5m', ...)
});

cron.schedule("0 0 * * * *", () => {
  console.log("Every 1 hour:", new Date().toISOString());
  // refresh_continuous_aggregate('candles_1h', ...)
});
