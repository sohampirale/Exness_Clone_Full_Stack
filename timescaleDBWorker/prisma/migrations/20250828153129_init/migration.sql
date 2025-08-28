-- CreateTable
CREATE TABLE "public"."BINANCE_MARK_PRICE" (
    "time" TIMESTAMP(3) NOT NULL,
    "symbol" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "BINANCE_MARK_PRICE_pkey" PRIMARY KEY ("time","symbol")
);
