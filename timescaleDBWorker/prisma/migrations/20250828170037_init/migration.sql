/*
  Warnings:

  - The primary key for the `binance_mark_prices` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "public"."binance_mark_prices" DROP CONSTRAINT "binance_mark_prices_pkey",
ALTER COLUMN "time" SET DATA TYPE TIMESTAMPTZ(6),
ADD CONSTRAINT "binance_mark_prices_pkey" PRIMARY KEY ("time", "symbol");
