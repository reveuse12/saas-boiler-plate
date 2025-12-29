# Database Setup Guide

## Connecting a New Database

### Step 1: Update Environment Variables

Edit `.env` file and update the `DATABASE_URL`:

```env
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
```

### Step 2: Push Schema to Database

This creates all tables in your new database:

```bash
bun run db:push
```

This command:
- Creates all tables defined in `src/db/schema.ts`
- Sets up indexes and constraints
- No migration files needed for development

### Step 3: Create Super Admin

Create the first super admin user:

```bash
bun run create-admin
```

Follow the prompts to enter:
- Email
- Password
- Name

### Step 4: Start Development

```bash
bun run dev
```

## Available Database Commands

```bash
# Push schema changes to database (development)
bun run db:push

# Open Drizzle Studio (database GUI)
bun run db:studio

# Generate migration files (production)
bun run db:generate

# Run migrations (production)
bun run db:migrate

# Create super admin user
bun run create-admin
```

## Production Migrations

For production, use migrations instead of push:

```bash
# 1. Generate migration files
bun run db:generate

# 2. Review migration files in drizzle/ folder

# 3. Run migrations
bun run db:migrate
```

## Troubleshooting

### Connection Issues

- Ensure database is accessible
- Check SSL mode requirements
- Verify credentials

### Schema Issues

- Delete all tables and run `bun run db:push` again
- Or use `bun run db:generate` and `bun run db:migrate` for controlled migrations

### No Super Admin

- Run `bun run create-admin` to create one
- Check database connection if script fails
