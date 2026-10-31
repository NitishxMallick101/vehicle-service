# Vehicle Makes & Types Service

NestJS/TypeScript service that imports vehicle makes and vehicle types from the
NHTSA vPIC XML API, stores them in PostgreSQL, and serves the saved data from
one GraphQL endpoint.

The unified result follows the reference Gist:

```json
[
  {
    "makeId": "440",
    "makeName": "FORD",
    "vehicleTypes": [
      { "typeId": "2", "typeName": "Passenger Car" }
    ]
  }
]
```

GraphQL `ID` fields serialize as strings, matching the reference output. The
database uses integer IDs and does not store a second JSON copy of the
relational data.

## Requirements

- Node.js 20.19+
- Docker and Docker Compose (for local PostgreSQL)
- npm

## Run locally

1. Install dependencies and configure the environment:

   ```sh
   npm install
   cp .localEnv.example .env
   ```

   The default connection uses PostgreSQL's standard `postgres` username and
   the local-development password `postgres`, with database `vehicle_service`.
   If you already have PostgreSQL installed locally, make sure that database
   and credentials exist, or set `DATABASE_URL` to your own connection URL.

2. Start PostgreSQL using Docker Compose:

   ```sh
   docker compose up -d db
   ```

3. Apply the migration, build, and start the API:

   ```sh
   npm run build
   npm run migration:run
   npm start
   ```

   The GraphQL endpoint is `http://localhost:3000/graphql`.

4. Import the current vPIC data in a separate terminal:

   ```sh
   npm run ingest
   ```

   Ingestion fetches the make list and then requests vehicle types with bounded
   concurrency. vPIC currently returns many thousands of makes, so a complete
   import can take a while. It is intentionally not run on API startup or on
   GraphQL reads.

For development with automatic reload:

```sh
npm run start:dev
```

Run migrations before starting the API. To reapply ingestion, run
`npm run ingest`; each successful import atomically replaces the previous
snapshot.

## Docker Compose

Build and run PostgreSQL and the API:

```sh
docker compose up --build
```

The API container applies migrations before starting NestJS. Import data after
the API is running:

```sh
docker compose exec api node dist/ingest.js
```

Compose uses the `POSTGRES_DB`, `POSTGRES_USER`, and `POSTGRES_PASSWORD`
variables (defaulting to `vehicle_service`, `postgres`, and `postgres`). It
configures the API with the Compose service hostname `db`; the local `.env`
`DATABASE_URL` instead uses `localhost`. These credentials are for local
development only. Override them for shared or deployed environments. If the
PostgreSQL volume was initialized with different credentials, changing these
environment values alone does not change the existing database user's password.

## Configuration

Copy `.localEnv.example` to `.env`. The settings are validated at startup.

| Variable | Meaning | Default |
| --- | --- | --- |
| `NODE_ENV` | Runtime environment (`development`, `test`, `production`) | `development` |
| `PORT` | HTTP port | `3000` |
| `LOG_LEVEL` | Nest log threshold | `log` |
| `DATABASE_URL` | PostgreSQL connection URL | `postgres://postgres:postgres@localhost:5432/vehicle_service` |
| `DATABASE_SSL` | Enable TLS with certificate verification | `false` |
| `DATABASE_POOL_SIZE` | Maximum PostgreSQL pool size | `10` |
| `POSTGRES_DB` | Compose PostgreSQL database name | `vehicle_service` |
| `POSTGRES_USER` | Compose PostgreSQL username | `postgres` |
| `POSTGRES_PASSWORD` | Compose PostgreSQL password; use a secret outside local development | `postgres` |
| `VPIC_BASE_URL` | vPIC API base URL | `https://vpic.nhtsa.dot.gov/api/vehicles` |
| `VPIC_TIMEOUT_MS` | Per-request timeout in milliseconds | `20000` |
| `VPIC_RETRIES` | Bounded retry count for network/429/5xx failures | `2` |
| `VPIC_CONCURRENCY` | Maximum simultaneous type requests | `8` |

Do not commit `.env` or production credentials.

## GraphQL

The schema is generated from typed NestJS object types. The API reads only from
PostgreSQL and currently exposes two paginated/look-up queries:

```graphql
query {
  makes(limit: 100, offset: 0) {
    makeId
    makeName
    vehicleTypes {
      typeId
      typeName
    }
  }
}
```

```graphql
query {
  make(makeId: 440) {
    makeId
    makeName
    vehicleTypes {
      typeId
      typeName
    }
  }
}
```

`makes.limit` is restricted to 1–500; `offset` must be non-negative. `make`
returns `null` when the ID is not in the database. Vehicle types are fetched
with their make records in the same repository query to avoid per-make resolver
round trips.

Swagger UI is available at `http://localhost:3000/docs`, and its OpenAPI JSON
is available at `http://localhost:3000/docs-json`. Because GraphQL is not a
REST API, Swagger documents the HTTP `POST /graphql` transport, its request and
response envelopes, and runnable example query bodies; the generated GraphQL
schema remains the canonical definition of fields and types.

## Data model and ingestion

- `makes`: `make_id` primary key and `make_name`.
- `vehicle_types`: composite primary key `(make_id, type_id)` and
  `type_name`; `make_id` references `makes` with `ON DELETE CASCADE`.
- `make_name` is indexed for future name-based lookup. Foreign keys and the
  composite key enforce referential integrity and avoid duplicate types.
- The XML parser validates XML and required upstream fields before transforming
  them. The pure transformation layer creates `{ makeId, makeName,
  vehicleTypes: [{ typeId, typeName }] }`.
- A complete snapshot is written inside a PostgreSQL transaction in batches.
  An upstream failure or transformation error occurs before replacement starts;
  a database failure rolls back the transaction. An empty make response is
  treated as an error so it cannot erase a previously imported snapshot.
- API requests use a timeout and bounded exponential retry for network errors,
  HTTP 429, and HTTP 5xx. Requests are concurrency-limited. Logs are JSON and
  include operation context without logging upstream response bodies.
- Ingestion logs lifecycle and failure summaries at `log`/`error`, aggregate
  progress at `debug`, per-make progress and successful upstream requests at
  `verbose`; GraphQL logs query starts at `debug`, result summaries at
  `verbose`, and invalid arguments at `warn`. Upstream retries are also logged
  at `warn`. Configure `LOG_LEVEL` to show additional detail; verbose per-make
  logs can be substantial for a complete import.
- Production schema changes are applied with migrations; TypeORM
  `synchronize` is disabled.

## Migrations, build, and tests

```sh
npm run migration:run
npm run build
npm test
```

Unit tests cover XML parsing, empty and malformed XML, the reference data shape,
duplicate/missing transformation data, mocked upstream requests and failures,
and persistence failures. They do not require a live vPIC service or PostgreSQL.
