# Shortit

A small, self-hosted URL shortener built with Node.js, Express, and PostgreSQL.

Shortit accepts a long URL, generates a short key, stores the mapping in PostgreSQL, and redirects visitors when they use the short URL.

Production site: [shortit.tech](https://shortit.tech)

## What It Does

```text
Long URL
	|
	| POST /shortenUrl
	v
Express + PostgreSQL
	|
	| { shortKey: "abc123" }
	v
https://shortit.tech/abc123
	|
	| GET /abc123
	v
Redirect to the original URL
```

## Current Stack

| Layer | Technology |
| --- | --- |
| Runtime | Node.js |
| Web server | Express 5 |
| Database | PostgreSQL on EC2 |
| Database client | `pg` |
| Configuration | `dotenv` |
| Cross-origin support | `cors` |
| Production process manager | PM2 |
| Reverse proxy and HTTPS | NGINX and Certbot |

## Project Structure

```text
shortit/
├── index.html                         Frontend page
├── index.js                           Express server and routes
├── schema.sql                         PostgreSQL table definition
├── package.json                       Dependencies and project metadata
├── Additional features.md             Feature checklist
└── specs/
	 ├── database-integration.md        PostgreSQL behavior and acceptance criteria
	 └── ec2-postgresql-setup.md        EC2 database setup notes
```

## Run Locally

### Prerequisites

- Node.js and npm
- PostgreSQL running locally
- A PostgreSQL database named `shortit`

Install dependencies:

```bash
npm install
```

Create the database if it does not exist yet:

```bash
createdb shortit
```

Or, from the PostgreSQL prompt:

```sql
CREATE DATABASE shortit;
```

Create a local `.env` file in the project root:

```env
PGHOST=127.0.0.1
PGPORT=5432
PGDATABASE=shortit
PGUSER=postgres
PGPASSWORD=your-postgres-password
```

The application loads `.env` automatically when `index.js` starts. Never commit this file.

Start the server:

```bash
node index.js
```

The server listens on:

```text
http://localhost:2005
```

There is currently no `npm start` script. Use `node index.js` directly or start the file with PM2.

## Database Setup

The application connects to PostgreSQL before it starts accepting requests. At startup, it runs `CREATE TABLE IF NOT EXISTS` for the `urls` table.

The schema is also available in [schema.sql](schema.sql) for manual setup:

```bash
psql -h 127.0.0.1 -U postgres -d shortit -f schema.sql
```

The table contains:

| Column | Purpose |
| --- | --- |
| `short_key` | The generated short identifier and primary key |
| `long_url` | The original destination URL |
| `created_at` | The creation timestamp |

The application uses parameterized queries, so URL values are not interpolated directly into SQL statements.

## API

### Create a short URL

```http
POST /shortenUrl
Content-Type: application/json
```

Request:

```json
{
  "longUrl": "https://example.com"
}
```

Example with `curl`:

```bash
curl -X POST http://localhost:2005/shortenUrl \
  -H "Content-Type: application/json" \
  -d '{"longUrl":"https://example.com"}'
```

Successful response:

```json
{
  "shortKey": "abc123"
}
```

### Redirect with a short URL

```http
GET /:shortKey
```

Example:

```bash
curl -i http://localhost:2005/abc123
```

The server looks up `abc123` in PostgreSQL and redirects to the stored long URL.

### Error responses

| Situation | Status | Response |
| --- | ---: | --- |
| Invalid or missing URL | `400` | `Please provide a valid URL.` |
| Unknown short key | `404` | `Short URL not found.` |
| Database failure | `500` | A generic operation error |

## Production Deployment

The current production architecture is:

```text
Internet
	|
	| HTTPS :443
	v
NGINX
	|
	| http://localhost:2005
	v
Node.js managed by PM2
	|
	| localhost:5432
	v
PostgreSQL on EC2
```

### EC2 application path

```text
/home/ec2-user/shortit
```

### Update the deployment

```bash
cd /home/ec2-user/shortit
git pull origin main
npm ci
pm2 restart shortit
```

Check the process:

```bash
pm2 status
pm2 logs shortit
```

For a first-time PM2 setup:

```bash
cd /home/ec2-user/shortit
pm2 start index.js --name shortit
pm2 save
pm2 startup
```

Run the `sudo` command printed by `pm2 startup`, then run `pm2 save` again. This makes the application survive SSH disconnects and EC2 reboots.

### NGINX and HTTPS checks

NGINX should proxy the public domain to Node on port `2005`:

```nginx
proxy_pass http://localhost:2005;
```

Useful checks:

```bash
sudo nginx -t
sudo systemctl status nginx
curl http://localhost:2005
curl http://localhost
curl -I https://shortit.tech
```

The public security group should allow ports `80` and `443`. Port `2005` should not need to be publicly exposed when NGINX is running on the same EC2 instance. PostgreSQL port `5432` should remain private.

## Troubleshooting

Check the layers from the application outward:

1. Check PM2:

	```bash
	pm2 status
	pm2 logs shortit
	```

2. Check Node directly:

	```bash
	curl http://localhost:2005
	```

3. Check NGINX:

	```bash
	sudo nginx -t
	sudo systemctl status nginx
	```

4. Check DNS:

	```bash
	dig +short shortit.tech
	dig +short www.shortit.tech
	```

5. Check certificate renewal:

	```bash
	sudo certbot renew --dry-run
	```

If Node fails at startup with a PostgreSQL error, check that `.env` exists in `/home/ec2-user/shortit` and that the database credentials work:

```bash
psql -h 127.0.0.1 -U postgres -d shortit -W
```

## Security Notes

- Keep `.env` out of GitHub.
- Do not expose PostgreSQL port `5432` publicly.
- Do not expose port `2005` publicly when NGINX is handling traffic.
- The current deployment uses the PostgreSQL `postgres` user for simplicity. A dedicated application role with a strong password is safer for a long-lived production deployment.
- Do not commit SSH keys, database passwords, AWS credentials, or TLS private keys.

## Current Limitations

This is intentionally a small project. The following features are not implemented yet:

- Duplicate long URLs returning the existing short key
- Retry handling for generated short-key collisions
- Custom short keys
- URL expiry
- Analytics
- Automated tests
- Automated GitHub-to-EC2 deployment

See [Additional features.md](Additional%20features.md) for the working checklist.

## Documentation

- [PostgreSQL integration specification](specs/database-integration.md)
- [EC2 PostgreSQL setup](specs/ec2-postgresql-setup.md)
- [Feature checklist](Additional%20features.md)

## License

This project currently uses the license value declared in `package.json`.
