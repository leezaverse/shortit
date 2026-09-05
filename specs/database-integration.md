# PostgreSQL Database Integration

## Status

Implemented

## Goal

Replace the in-memory URL map with a PostgreSQL database running on the EC2 instance.

## Database Connection

The Node.js application uses the `pg` package and reads the normal PostgreSQL environment variables:

```text
PGHOST=127.0.0.1
PGPORT=5432
PGDATABASE=shortit
PGUSER=shortit_app
PGPASSWORD=<password>
```

The password must not be committed to the repository.

## Schema

The table definition is also available in [schema.sql](../schema.sql). The Node.js application creates the table with the same `CREATE TABLE IF NOT EXISTS` statement when the server starts.

```sql
CREATE TABLE IF NOT EXISTS urls (
    short_key TEXT PRIMARY KEY,
    long_url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

The server must finish table creation before it starts accepting requests.

## API Behavior

### `POST /shortenUrl`

The request body is:

```json
{
  "longUrl": "https://example.com"
}
```

The route:

1. Validates the URL.
2. Generates a short key.
3. Inserts the short key and long URL using a parameterized PostgreSQL query.
4. Returns the generated short key.

Success response:

```json
{
  "shortKey": "abc123"
}
```

Invalid URLs return HTTP `400`:

```json
{
  "error": "Please provide a valid URL."
}
```

A database insert failure returns HTTP `500`:

```json
{
  "error": "Unable to shorten URL."
}
```

### `GET /:shortKey`

The route looks up the short key using a parameterized PostgreSQL query.

- If found, redirect to the stored `long_url`.
- If not found, return HTTP `404`.
- If the query fails, return HTTP `500`.

Missing-key response:

```json
{
  "error": "Short URL not found."
}
```

## Out of Scope

These are separate future features:

- Returning the existing key for the same long URL.
- Custom short keys.
- URL expiry.
- Analytics.
- Database migrations from an older database.

## Acceptance Criteria

- [x] `pg` is used instead of SQLite.
- [x] PostgreSQL connection details are not hardcoded.
- [x] Table creation runs automatically when the server starts.
- [x] Values are passed through parameterized queries.
- [x] Valid URLs are stored in PostgreSQL.
- [x] Stored URLs redirect after a Node.js restart.
- [x] Unknown short keys return HTTP `404`.
- [x] Invalid URLs return HTTP `400`.
