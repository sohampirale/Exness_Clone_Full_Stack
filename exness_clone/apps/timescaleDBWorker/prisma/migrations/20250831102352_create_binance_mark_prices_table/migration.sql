-- CreateTable
CREATE TABLE "public"."binance_mark_prices" (
    "time" TIMESTAMP(3) NOT NULL,
    "symbol" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "binance_mark_prices_pkey" PRIMARY KEY ("time","symbol")
);

-- CreateIndex
CREATE INDEX "binance_mark_prices_time_idx" ON "public"."binance_mark_prices"("time" DESC);
