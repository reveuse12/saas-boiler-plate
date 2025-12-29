# SaaS Boilerplate

Multi-tenant SaaS boilerplate built with Next.js 16, featuring tenant isolation, authentication, and super admin panel.

## Features

- 🏢 **Multi-tenancy** - Complete tenant isolation with subdomain/path-based routing
- 🔐 **Authentication** - NextAuth.js v5 with credentials provider
- 👥 **User Management** - Role-based access control (Owner, Admin, Member)
- 🛡️ **Super Admin Panel** - Platform-level management dashboard
- 📝 **Audit Logs** - Track all admin actions
- 🔑 **Password Reset** - Secure token-based password recovery
- 💾 **Database** - PostgreSQL with Drizzle ORM
- 🎨 **UI Components** - Radix UI + Tailwind CSS

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Auth**: NextAuth.js v5
- **Database**: PostgreSQL (Neon)
- **ORM**: Drizzle
- **UI**: Radix UI + Tailwind CSS
- **State**: Zustand + TanStack Query
- **Validation**: Zod
- **Runtime**: Bun

## Getting Started

### Prerequisites

- Bun installed
- PostgreSQL database (Neon recommended)

### Installation

```bash
# Install dependencies
bun install

# Set up environment variables
cp .env.example .env

# Run database migrations
bun run db:push

# Create super admin
bun run create-admin
```

### Environment Variables

```env
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=http://localhost:3000
PROTOCOL=http
ROOT_DOMAIN=localhost:3000
```

### Development

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build

```bash
bun run build
bun run start
```

## Project Structure

```
src/
├── app/                    # Next.js app router
│   ├── (auth)/            # Auth pages (login, signup, etc.)
│   ├── (platform)/        # Tenant-scoped pages
│   ├── admin/             # Super admin panel
│   └── api/               # API routes
├── components/            # React components
├── db/                    # Database schema
├── lib/
│   ├── dal/              # Data access layer
│   ├── middleware/       # Custom middleware
│   └── validations/      # Zod schemas
└── hooks/                # Custom React hooks
```

## Key Features

### Multi-Tenancy
- Tenant isolation at database level
- Subdomain or path-based routing
- Tenant-specific user management

### Authentication
- Secure credential-based auth
- Session management with JWT
- Password reset flow
- Protected routes

### Super Admin Panel
- Manage all tenants
- User administration
- Audit log tracking
- Platform statistics

## Scripts

- `bun run dev` - Start development server
- `bun run build` - Build for production
- `bun run start` - Start production server
- `bun run lint` - Run ESLint
- `bun run create-admin` - Create super admin user

## License

MIT
