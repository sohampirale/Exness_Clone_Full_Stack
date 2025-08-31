-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Create table
CREATE TABLE IF NOT EXISTS binance_mark_prices (
    time TIMESTAMPTZ NOT NULL,
    price NUMERIC NOT NULL,
    symbol TEXT NOT NULL
);

-- Convert table to hypertable
SELECT create_hypertable('binance_mark_prices', 'time', if_not_exists => TRUE);
