# Architecture Documentation

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (Browser)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  Next.js    │  │  React      │  │  Zustand    │             │
│  │  App Router │  │  Components │  │  State      │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
└─────────┼────────────────┼────────────────┼────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Next.js Server                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  Server     │  │  API Routes │  │  Middleware │             │
│  │  Components │  │  (REST)     │  │  (Auth)     │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
└─────────┼────────────────┼────────────────┼────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Supabase Platform                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  PostgreSQL │  │  Auth       │  │  Storage    │             │
│  │  (Database) │  │  (JWT)      │  │  (Files)    │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  Realtime   │  │  Edge       │  │  Functions  │             │
│  │  (Subscriptions)│  (Auth)    │  │  (Serverless)           │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
```

## Frontend Architecture

### Next.js App Router Structure
```
app/
├── (auth)/              # Auth route group (no layout)
│   ├── login/
│   ├── register/
│   └── invite/
├── dashboard/           # Main authenticated area
├── stories/             # Story management
├── people/              # Family members
├── tree/                # Family tree visualization
├── timeline/            # Chronological timeline
├── memories/            # Memories & testimonies
├── photos/              # Photo gallery
├── documents/           # Document management
├── search/              # Search interface
├── autobiography/       # Guided autobiography
├── compiler/            # Book compiler
├── admin/               # Admin panel
├── settings/            # User settings
├── api/                 # API routes
├── layout.tsx           # Root layout
├── page.tsx             # Landing page
└── globals.css          # Global styles
```

### Component Architecture
```
components/
├── layout/              # Layout components (Navbar, Sidebar, Footer)
├── stories/             # Story-specific components
├── people/              # Person-specific components
├── tree/                # Tree visualization components
├── timeline/            # Timeline components
├── media/               # Media/photo components
├── autobiography/       # Autobiography components
├── compiler/            # Book compiler components
└── ui/                  # Base UI components (Button, Card, Input, etc.)
```

### State Management
- **Server State**: React Server Components + Supabase client
- **Client State**: Zustand for global UI state
- **Form State**: React Hook Form with Zod validation
- **Auth State**: Custom hook with Supabase auth listener

### Data Fetching Patterns
1. **Server Components**: Direct Supabase queries in async components
2. **Client Components**: SWR for caching and revalidation
3. **Server Actions**: Form submissions and mutations
4. **API Routes**: Complex operations, webhooks, exports

## Backend Architecture

### Supabase Services

#### PostgreSQL Database
- Multi-tenant with Row Level Security
- Comprehensive indexing strategy
- Full-text search with GIN indexes
- Materialized views for complex queries
- Automated triggers for updated_at

#### Authentication
- Email/password with secure defaults
- OAuth providers (Google, GitHub)
- Magic links for passwordless
- JWT with automatic refresh
- Row Level Security integration

#### Storage
- Bucket per media type (photos, documents, media)
- Signed URLs for private access
- Image transformations on-the-fly
- CDN distribution

#### Realtime
- Presence for collaborative editing
- Broadcast for live updates
- Postgres changes for automatic UI updates

#### Edge Functions
- PDF/DOCX generation
- Image processing
- Email notifications
- Search indexing
- Data exports

### API Design

#### REST Endpoints
```
GET    /api/stories              # List stories
POST   /api/stories              # Create story
GET    /api/stories/:id          # Get story
PATCH  /api/stories/:id          # Update story
DELETE /api/stories/:id          # Delete story

GET    /api/people               # List people
POST   /api/people               # Create person
GET    /api/people/:id           # Get person
PATCH  /api/people/:id           # Update person

GET    /api/timeline             # List events
POST   /api/timeline             # Create event

POST   /api/upload               # Upload file

POST   /api/export/pdf           # Export PDF
POST   /api/export/docx          # Export DOCX

GET    /api/search               # Search all content
```

#### Response Format
```typescript
// Success
{ data: T, count?: number }

// Error
{ error: string, code?: string, details?: any }
```

## Security Architecture

### Authentication Flow
```
1. User submits credentials
2. Supabase Auth validates
3. JWT issued (access + refresh tokens)
4. Tokens stored in httpOnly cookies
5. Middleware validates on each request
6. RLS policies enforce data access
```

### Authorization Model
```
Family (Tenant)
├── Owner (1) - Full control
├── Admin (N) - Manage members, settings
├── Editor (N) - Create/edit all content
├── Contributor (N) - Create content
└── Viewer (N) - Read only
```

### Data Isolation
- Every table has `family_id` column
- RLS policies filter by `family_id`
- Users only see data from their families
- Cross-family queries impossible

### File Security
- Private buckets for family media
- Signed URLs with expiration
- Type validation on upload
- Size limits enforced

## Performance Optimization

### Database
- Strategic indexes on all query paths
- GIN indexes for full-text search
- Partial indexes for status filtering
- Connection pooling via Supabase

### Frontend
- Server Components by default
- Static generation for landing page
- Incremental Static Regeneration for content
- Code splitting by route
- Image optimization with Next.js Image

### Caching
- SWR for client-side data caching
- HTTP caching headers for static assets
- Supabase query result caching
- CDN for storage assets

## Deployment Architecture

### Vercel (Frontend)
- Edge network deployment
- Automatic SSL
- Preview deployments
- Edge Functions for middleware
- Analytics and monitoring

### Supabase (Backend)
- Managed PostgreSQL
- Automatic backups
- Point-in-time recovery
- Read replicas for scaling
- Global edge network

### CI/CD Pipeline
```
Push → GitHub Actions → Lint → Typecheck → Test → Build → Deploy
                                    ↓
                              Vercel Preview
                                    ↓
                              Manual Approval
                                    ↓
                              Production Deploy
```

## Monitoring & Observability

### Frontend
- Vercel Analytics
- Error tracking (Sentry)
- Core Web Vitals
- User session recording

### Backend
- Supabase Dashboard metrics
- Database performance insights
- Auth analytics
- Storage usage
- Function logs

### Custom Events
- Activity log for audit trail
- User action tracking
- Performance markers
- Error boundaries

## Scalability Considerations

### Horizontal Scaling
- Supabase handles DB scaling
- Vercel handles frontend scaling
- Edge Functions for compute
- CDN for static assets

### Database Optimization
- Partitioning for large tables (activity_log)
- Read replicas for heavy queries
- Materialized views for dashboards
- Archive strategy for old data

### Caching Strategy
- Multi-layer caching (CDN, SWR, DB)
- Cache invalidation on mutations
- Stale-while-revalidate pattern
- Selective cache bypass

## Development Workflow

### Local Development
```bash
# Start Supabase locally
supabase start

# Run migrations
supabase db push

# Seed data
supabase db seed

# Start Next.js
npm run dev
```

### Type Generation
```bash
# Generate TypeScript types from DB
supabase gen types typescript --local > types/database.ts
```

### Testing Strategy
- Unit tests for utilities and hooks
- Integration tests for API routes
- E2E tests for critical flows
- Visual regression for UI components

## Future Architecture Evolution

### Planned Improvements
1. **Micro-frontends** for team autonomy
2. **Event sourcing** for audit trail
3. **CQRS** for read/write separation
4. **GraphQL** for flexible queries
5. **WebAssembly** for client-side processing
6. **Offline-first** with Service Workers
7. **Real-time collaboration** with CRDTs