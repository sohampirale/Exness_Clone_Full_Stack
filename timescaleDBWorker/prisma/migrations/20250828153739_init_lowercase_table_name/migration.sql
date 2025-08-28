/*
  Warnings:

  - You are about to drop the `BINANCE_MARK_PRICE` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "public"."BINANCE_MARK_PRICE";

-- CreateTable
CREATE TABLE "public"."binance_mark_prices" (
    "time" TIMESTAMP(3) NOT NULL,
    "symbol" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "binance_mark_prices_pkey" PRIMARY KEY ("time","symbol")
);
