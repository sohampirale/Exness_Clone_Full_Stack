
-- 1-minute candles continuous aggregate
CREATE MATERIALIZED VIEW candles_1m
WITH (timescaledb.continuous) AS
SELECT 
    time_bucket('1 minute', time) AS bucket,
    symbol,
    first(price, time) AS open,
    max(price) AS high,
    min(price) AS low,
    last(price, time) AS close
FROM binance_mark_prices
GROUP BY bucket, symbol
WITH NO DATA;

-- 5-minute candles continuous aggregate
CREATE MATERIALIZED VIEW candles_5m
WITH (timescaledb.continuous) AS
SELECT 
    time_bucket('5 minutes', time) AS bucket,
    symbol,
    first(price, time) AS open,
    max(price) AS high,
    min(price) AS low,
    last(price, time) AS close
FROM binance_mark_prices
GROUP BY bucket, symbol
WITH NO DATA;


-- 1-hour candles continuous aggregate
CREATE MATERIALIZED VIEW candles_1h
WITH (timescaledb.continuous) AS
SELECT 
    time_bucket('1 hour', time) AS bucket,
    symbol,
    first(price, time) AS open,
    max(price) AS high,
    min(price) AS low,
    last(price, time) AS close
FROM binance_mark_prices
GROUP BY bucket, symbol
WITH NO DATA;

