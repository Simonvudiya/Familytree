# Database Schema Documentation

## Overview
PostgreSQL database designed for multi-tenant family history preservation with comprehensive relationship modeling, content management, and audit trails.

## Extensions
- `uuid-ossp` - UUID generation
- `pg_trgm` - Trigram similarity for search
- `fuzzystrmatch` - Fuzzy string matching

## Custom Types
```sql
user_role: owner | admin | editor | viewer | contributor
story_status: draft | review | published | archived
story_visibility: private | family | public
relationship_type: parent | child | spouse | partner | sibling | half-sibling | adoptive-parent | adoptive-child | step-parent | step-child | godparent | godchild
event_type: birth | death | marriage | divorce | graduation | career | military | migration | achievement | historical | custom
memory_type: testimony | memory | quote | recipe | tradition | custom
autobiography_status: not_started | in_progress | completed | archived
chapter_status: planned | writing | review | finalized
book_status: draft | compiling | ready | published
book_format: pdf | docx | epub | print
```

## Tables

### profiles
Auth-linked contributor profiles used for family-visible author attribution.
- `id` UUID PK/FK → auth.users
- `full_name` TEXT
- `email` TEXT
- `avatar_url` TEXT
- `created_at` TIMESTAMPTZ
- `updated_at` TIMESTAMPTZ
- Profiles are created and synchronized by an auth.users trigger. Members can read profiles for active relatives in their family; users can update only their own profile.

### families
Core family group entity.
- `id` UUID PK
- `name` TEXT NOT NULL
- `description` TEXT
- `created_by` UUID FK → auth.users
- `created_at` TIMESTAMPTZ
- `updated_at` TIMESTAMPTZ
- `settings` JSONB (allow_member_invite, require_approval, default_member_role, visibility)

### family_members
Junction table for family membership with roles.
- `id` UUID PK
- `family_id` UUID FK → families
- `user_id` UUID FK → auth.users
- `role` user_role
- `status` pending | active | removed
- `joined_at` TIMESTAMPTZ
- `invited_by` UUID FK → auth.users
- Unique: (family_id, user_id)

### invitations
Email invitations for family membership.
- `id` UUID PK
- `family_id` UUID FK → families
- `email` TEXT
- `role` user_role
- `token` UUID UNIQUE
- `status` pending | accepted | expired | revoked
- `expires_at` TIMESTAMPTZ
- `created_at` TIMESTAMPTZ
- `invited_by` UUID FK → auth.users

### people
Family tree members (living or deceased).
- `id` UUID PK
- `family_id` UUID FK → families
- `created_by` UUID FK → auth.users
- `name` TEXT NOT NULL
- `slug` TEXT NOT NULL (unique per family)
- `sex` male | female | other
- `birth_date` DATE
- `birth_place` TEXT
- `death_date` DATE
- `death_place` TEXT
- `bio` TEXT
- `profile_image` TEXT
- `is_living` BOOLEAN
- `generation` INT
- `created_at` TIMESTAMPTZ
- `updated_at` TIMESTAMPTZ
- Unique: (family_id, slug)

### relationships
Flexible relationship model between people.
- `id` UUID PK
- `family_id` UUID FK → families
- `person_id` UUID FK → people
- `related_person_id` UUID FK → people
- `type` relationship_type
- `created_at` TIMESTAMPTZ
- Unique: (person_id, related_person_id, type)

### stories
Rich text family stories with versioning.
- `id` UUID PK
- `family_id` UUID FK → families
- `author_id` UUID FK → auth.users
- `title` TEXT NOT NULL
- `slug` TEXT NOT NULL
- `content` TEXT NOT NULL
- `excerpt` TEXT
- `event_date` DATE (when the described event happened)
- `event_year` INT (approximate or known historical year)
- `category` TEXT
- `location` TEXT
- `status` story_status
- `visibility` story_visibility
- `tags` TEXT[]
- `word_count` INT
- `reading_time` INT
- `featured_image` TEXT
- `published_at` TIMESTAMPTZ
- `created_at` TIMESTAMPTZ
- `updated_at` TIMESTAMPTZ
- Unique: (family_id, slug)
- Story author and family attribution are immutable. A database trigger saves the previous title and content to `story_versions` before textual edits.
- Family members can read published family stories; authors and authorized editors can read drafts. Contributors cannot publish directly.

### story_versions
Version history for stories.
- `id` UUID PK
- `story_id` UUID FK → stories
- `content` TEXT
- `title` TEXT
- `created_by` UUID FK → auth.users
- `created_at` TIMESTAMPTZ
- `change_summary` TEXT

### story_people
Junction: people mentioned in stories.
- `id` UUID PK
- `story_id` UUID FK → stories
- `person_id` UUID FK → people
- `relationship` TEXT
- Unique: (story_id, person_id)

### story_comments
Threaded comments on stories.
- `id` UUID PK
- `story_id` UUID FK → stories
- `user_id` UUID FK → auth.users
- `content` TEXT
- `parent_id` UUID FK → story_comments
- `created_at` TIMESTAMPTZ
- `updated_at` TIMESTAMPTZ

### timeline_events
Chronological family events.
- `id` UUID PK
- `family_id` UUID FK → families
- `created_by` UUID FK → auth.users
- `title` TEXT NOT NULL
- `description` TEXT
- `date` DATE NOT NULL
- `end_date` DATE
- `location` TEXT
- `event_type` event_type
- `significance` personal | family | historical | milestone
- `tags` TEXT[]
- `created_at` TIMESTAMPTZ
- `updated_at` TIMESTAMPTZ

### timeline_event_people
Junction: people involved in events.
- `id` UUID PK
- `event_id` UUID FK → timeline_events
- `person_id` UUID FK → people
- Unique: (event_id, person_id)

### timeline_event_media
Media attachments for events.
- `id` UUID PK
- `event_id` UUID FK → timeline_events
- `type` image | document | audio | video
- `url` TEXT
- `thumbnail` TEXT
- `caption` TEXT

### media
General media files.
- `id` UUID PK
- `family_id` UUID FK → families
- `uploaded_by` UUID FK → auth.users
- `type` image | document | audio | video
- `url` TEXT
- `thumbnail` TEXT
- `filename` TEXT
- `size` BIGINT
- `mime_type` TEXT
- `metadata` JSONB
- `created_at` TIMESTAMPTZ

### documents
Scanned documents with OCR.
- `id` UUID PK
- `family_id` UUID FK → families
- `uploaded_by` UUID FK → auth.users
- `title` TEXT
- `description` TEXT
- `file_url` TEXT
- `thumbnail_url` TEXT
- `file_type` TEXT
- `file_size` BIGINT
- `ocr_text` TEXT
- `tags` TEXT[]
- `people_ids` UUID[]
- `created_at` TIMESTAMPTZ
- `updated_at` TIMESTAMPTZ

### memories
Testimonies, quotes, recipes, traditions.
- `id` UUID PK
- `family_id` UUID FK → families
- `author_id` UUID FK → auth.users
- `person_id` UUID FK → people
- `title` TEXT
- `content` TEXT
- `memory_type` memory_type
- `date` DATE
- `tags` TEXT[]
- `created_at` TIMESTAMPTZ
- `updated_at` TIMESTAMPTZ

### autobiography_sessions
Guided interview sessions.
- `id` UUID PK
- `family_id` UUID FK → families
- `person_id` UUID FK → people
- `interviewer_id` UUID FK → auth.users
- `status` autobiography_status
- `current_chapter` INT
- `total_chapters` INT
- `completed_chapters` INT[]
- `created_at` TIMESTAMPTZ
- `updated_at` TIMESTAMPTZ

### autobiography_responses
Individual question responses.
- `id` UUID PK
- `session_id` UUID FK → autobiography_sessions
- `question_id` TEXT
- `response` TEXT
- `audio_url` TEXT
- `created_at` TIMESTAMPTZ
- `updated_at` TIMESTAMPTZ

### chapters
Book chapters.
- `id` UUID PK
- `family_id` UUID FK → families
- `created_by` UUID FK → auth.users
- `title` TEXT
- `description` TEXT
- `order_index` INT
- `status` chapter_status
- `word_count` INT
- `stories` UUID[]
- `created_at` TIMESTAMPTZ
- `updated_at` TIMESTAMPTZ

### books
Compiled family books.
- `id` UUID PK
- `family_id` UUID FK → families
- `created_by` UUID FK → auth.users
- `title` TEXT
- `subtitle` TEXT
- `cover_image` TEXT
- `status` book_status
- `format` book_format
- `chapter_ids` UUID[]
- `settings` JSONB
- `generated_url` TEXT
- `created_at` TIMESTAMPTZ
- `updated_at` TIMESTAMPTZ

### activity_log
Audit trail for all actions.
- `id` UUID PK
- `family_id` UUID FK → families
- `user_id` UUID FK → auth.users
- `action` TEXT
- `entity_type` TEXT
- `entity_id` UUID
- `description` TEXT
- `metadata` JSONB
- `created_at` TIMESTAMPTZ

## Views

### family_tree
Computed family tree structure for visualization.
- `id` UUID
- `name` TEXT
- `sex` TEXT
- `birth_date` DATE
- `death_date` DATE
- `profile_image` TEXT
- `generation` INT
- `parent_ids` UUID[]
- `spouse_ids` UUID[]
- `child_ids` UUID[]

## Functions

### generate_slug(input TEXT) → TEXT
Generates URL-safe slug from input string.

### calculate_generation(person_id UUID) → INT
Computes generation number for a person.

### get_family_tree(family_id UUID, root_person_id UUID?) → family_tree[]
Returns complete family tree for visualization.

### search_family(family_id UUID, query TEXT, limit INT) → SETOF
Full-text search across all content types.

## Indexes
- Foreign key indexes on all FK columns
- Composite indexes for common query patterns
- GIN indexes for full-text search on stories, people, timeline_events
- Partial indexes for status filtering

## Row Level Security
All tables have RLS enabled with policies for:
- Family member access control
- Role-based permissions (owner, admin, editor, contributor, viewer)
- Content visibility (private, family, public)
- Authorship verification

## Triggers
- `update_updated_at_column()` - Auto-updates updated_at on all tables