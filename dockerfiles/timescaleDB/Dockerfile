FROM timescale/timescaledb:latest-pg16

ENV POSTGRES_USER=postgres
ENV POSTGRES_DB=exness_clone

COPY ./init-scripts/ /docker-entrypoint-initdb.d/
