# Our Family History Platform

A comprehensive platform for preserving, sharing, and celebrating family history across generations.

## Features

- **Family Stories** - Write, collect, and preserve stories with rich text editing and version history
- **Visual Family Tree** - Interactive family tree with drag-and-drop relationships
- **Family Timeline** - Chronological view of family events with historical context
- **People Profiles** - Detailed profiles with biographies, photos, and relationships
- **Guided Autobiography** - Chapter-by-chapter guided interviews for loved ones
- **Book Compiler** - Organize stories into chapters and compile professional family books
- **Memories & Testimonies** - Collect quotes, recipes, traditions, and testimonies
- **Photos & Documents** - Upload, organize, and preserve media with OCR support
- **Smart Search** - Full-text search across all content
- **Multi-family Support** - Role-based access control for collaborative family history

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **State Management**: React Hooks + Zustand
- **Forms**: React Hook Form + Zod
- **Rich Text**: React Markdown
- **Export**: PDF-lib, docx
- **Testing**: Jest + React Testing Library

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd family-history-platform
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your Supabase credentials in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

5. Set up the database:
```bash
# Start Supabase locally (optional)
npx supabase start

# Push migrations
npx supabase db push

# Seed with sample data
npx supabase db seed
```

6. Run the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
our-family-history/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication pages
│   ├── dashboard/         # User dashboard
│   ├── stories/           # Story management
│   ├── people/            # Family member profiles
│   ├── tree/              # Family tree visualization
│   ├── timeline/          # Chronological timeline
│   ├── memories/          # Memories & testimonies
│   ├── photos/            # Photo gallery
│   ├── documents/         # Document management
│   ├── search/            # Search interface
│   ├── autobiography/     # Guided autobiography
│   ├── compiler/          # Book compiler
│   ├── admin/             # Admin panel
│   ├── settings/          # User settings
│   └── api/               # API routes
├── components/            # React components
│   ├── layout/           # Layout components
│   ├── stories/          # Story components
│   ├── people/           # People components
│   ├── tree/             # Tree components
│   ├── timeline/         # Timeline components
│   ├── media/            # Media components
│   ├── autobiography/    # Autobiography components
│   ├── compiler/         # Compiler components
│   └── ui/               # Base UI components
├── lib/                   # Utility libraries
│   ├── supabase/         # Supabase clients
│   ├── auth/             # Auth utilities
│   ├── stories/          # Story utilities
│   ├── family/           # Family utilities
│   ├── export/           # Export utilities
│   └── search/           # Search utilities
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript types
├── supabase/              # Supabase configuration
│   ├── migrations/       # Database migrations
│   └── seed.sql          # Seed data
├── public/                # Static assets
├── docs/                  # Documentation
└── tests/                 # Test files
```

## Database Schema

The platform uses a comprehensive PostgreSQL schema with:

- **Families** - Multi-tenant family groups
- **People** - Family tree members with full biographical data
- **Relationships** - Flexible relationship types (parent, spouse, sibling, etc.)
- **Stories** - Rich text stories with version history
- **Timeline Events** - Chronological events with media
- **Memories** - Testimonies, quotes, recipes, traditions
- **Autobiography Sessions** - Guided interview sessions
- **Chapters & Books** - Book compilation structure
- **Media & Documents** - File storage with metadata
- **Activity Log** - Audit trail for all actions

## User Roles

- **Owner** - Full access, can manage family settings
- **Admin** - Can manage members and content
- **Editor** - Can create and edit content
- **Contributor** - Can create content
- **Viewer** - Read-only access

## Deployment

### Vercel (Recommended)

1. Connect your repository to Vercel
2. Add environment variables
3. Deploy

### Docker

```bash
docker build -t family-history .
docker run -p 3000:3000 family-history
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Run linting: `npm run lint`
6. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

- Documentation: [docs/](docs/)
- Issues: GitHub Issues
- Email: support@familyhistory.example.com