# Database Migrations

This folder contains SQL migration files that will be automatically executed when PostgreSQL container starts for the first time.

## How It Works

- Files in this directory are executed in alphabetical order
- Use naming convention: `001_create_users_table.sql`, `002_create_urls_table.sql`, etc.
- Migrations run only once when the database is initialized

## Migration Files

We'll add migration files here as we progress through the milestones:

1. `001_create_users_table.sql` - User authentication (Milestone 2)
2. `002_create_urls_table.sql` - URL shortening (Milestone 3)
3. `003_create_clicks_table.sql` - Analytics tracking (Milestone 4)

## Manual Migration

If you need to run migrations manually:

```bash
# Access PostgreSQL container
docker exec -it urlshortener-postgres psql -U admin -d urlshortener

# Run a specific migration file
docker exec -it urlshortener-postgres psql -U admin -d urlshortener -f /docker-entrypoint-initdb.d/001_create_users_table.sql
```

## Reset Database

To reset the database and re-run all migrations:

```bash
# Stop containers
docker-compose down

# Remove volumes
docker volume rm experimental_postgres_data

# Start fresh
docker-compose up -d postgres
```

## Notes

- Migration files are mounted as read-only
- Changes to migration files after initial setup won't be automatically applied
- For schema changes after initial setup, create new migration files or run SQL manually
