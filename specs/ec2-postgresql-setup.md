# PostgreSQL Setup on EC2

## Environment

- Application directory: `/home/ec2-user/shortit`
- SSH host: `ec2-13-233-41-173.ap-south-1.compute.amazonaws.com`
- SSH key on Mac: `$HOME/Downloads/march24key1.pem`
- PostgreSQL database: `shortit`
- PostgreSQL user: `shortit_app`

## 1. Connect to EC2

Run on the Mac:

```bash
chmod 400 "$HOME/Downloads/march24key1.pem"
ssh -i "$HOME/Downloads/march24key1.pem" ec2-user@ec2-13-233-41-173.ap-south-1.compute.amazonaws.com
```

## 2. Install PostgreSQL

For Amazon Linux:

```bash
sudo dnf install -y postgresql15 postgresql15-server
sudo postgresql-setup --initdb
sudo systemctl enable --now postgresql
```

For Ubuntu:

```bash
sudo apt update
sudo apt install -y postgresql
sudo systemctl enable --now postgresql
```

Check the service:

```bash
sudo systemctl status postgresql --no-pager
```

## 3. Create the database and user

Open PostgreSQL as the administrator:

```bash
sudo -u postgres psql
```

Run:

```sql
CREATE ROLE shortit_app LOGIN PASSWORD '<strong-password>';
CREATE DATABASE shortit OWNER shortit_app;
\q
```

Do not use the `postgres` administrator account in Node.js.

## 4. Create the table with `psql` (optional)

The server also creates the table automatically at startup. You can run the schema manually before starting the server if you prefer to verify or initialize it explicitly.

From the application directory:

```bash
cd /home/ec2-user/shortit
psql -h 127.0.0.1 -U shortit_app -d shortit -f schema.sql
```

Verify it:

```bash
psql -h 127.0.0.1 -U shortit_app -d shortit -c "\dt"
```

## 5. Configure the application

From `/home/ec2-user/shortit`:

```bash
export PGHOST=127.0.0.1
export PGPORT=5432
export PGDATABASE=shortit
export PGUSER=shortit_app
export PGPASSWORD='<strong-password>'
node index.js
```

Use your process manager's protected environment configuration for a long-running deployment. Do not commit the password.

## 6. Test the API

From the Mac:

```bash
curl -i -X POST http://13.233.41.173:2005/shortenUrl \
  -H 'Content-Type: application/json' \
  -d '{"longUrl":"https://example.com"}'
```

Use the returned `shortKey`:

```bash
curl -i http://13.233.41.173:2005/<short-key>
```

The response should redirect to `https://example.com`.

## 7. Check the stored row

On EC2:

```bash
psql -h 127.0.0.1 -U shortit_app -d shortit \
  -c "SELECT short_key, long_url, created_at FROM urls;"
```

## 8. Keep PostgreSQL private

PostgreSQL only needs to accept local connections for this application.

```bash
sudo ss -ltnp | grep 5432
```

Do not add port `5432` to the EC2 security group. Only the Node.js port `2005` needs public access for the current deployment.
