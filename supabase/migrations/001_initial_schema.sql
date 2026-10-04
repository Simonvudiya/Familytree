-- 001_initial_schema.sql
-- Initial database schema for Family History Platform

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "fuzzystrmatch";

-- Custom types
DO $$
BEGIN
  BEGIN CREATE TYPE user_role AS ENUM ('owner', 'admin', 'editor', 'viewer', 'contributor'); EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN CREATE TYPE story_status AS ENUM ('draft', 'review', 'published', 'archived'); EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN CREATE TYPE story_visibility AS ENUM ('private', 'family', 'public'); EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    CREATE TYPE relationship_type AS ENUM (
      'parent', 'child', 'spouse', 'partner', 'sibling', 'half-sibling',
      'adoptive-parent', 'adoptive-child', 'step-parent', 'step-child',
      'godparent', 'godchild'
    );
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    CREATE TYPE event_type AS ENUM (
      'birth', 'death', 'marriage', 'divorce', 'graduation', 'career',
      'military', 'migration', 'achievement', 'historical', 'custom'
    );
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN CREATE TYPE memory_type AS ENUM ('testimony', 'memory', 'quote', 'recipe', 'tradition', 'custom'); EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN CREATE TYPE autobiography_status AS ENUM ('not_started', 'in_progress', 'completed', 'archived'); EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN CREATE TYPE chapter_status AS ENUM ('planned', 'writing', 'review', 'finalized'); EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN CREATE TYPE book_status AS ENUM ('draft', 'compiling', 'ready', 'published'); EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN CREATE TYPE book_format AS ENUM ('pdf', 'docx', 'epub', 'print'); EXCEPTION WHEN duplicate_object THEN NULL; END;
END;
$$;

-- Families table
CREATE TABLE IF NOT EXISTS families (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  settings JSONB NOT NULL DEFAULT '{
    "allow_member_invite": true,
    "require_approval": false,
    "default_member_role": "contributor",
    "visibility": "family"
  }'::jsonb
);

-- Family members
CREATE TABLE IF NOT EXISTS family_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'contributor',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'removed')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  invited_by UUID REFERENCES auth.users(id),
  UNIQUE(family_id, user_id)
);

-- Invitations
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'contributor',
  token UUID NOT NULL DEFAULT uuid_generate_v4() UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  invited_by UUID NOT NULL REFERENCES auth.users(id)
);

-- People (family tree members)
CREATE TABLE people (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  sex TEXT CHECK (sex IN ('male', 'female', 'other')),
  birth_date DATE,
  birth_place TEXT,
  death_date DATE,
  death_place TEXT,
  bio TEXT,
  profile_image TEXT,
  is_living BOOLEAN DEFAULT TRUE,
  generation INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(family_id, slug)
);

-- Relationships
CREATE TABLE relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  related_person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  type relationship_type NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(person_id, related_person_id, type)
);

-- Stories
CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  status story_status NOT NULL DEFAULT 'draft',
  visibility story_visibility NOT NULL DEFAULT 'family',
  tags TEXT[] DEFAULT '{}',
  word_count INT DEFAULT 0,
  reading_time INT DEFAULT 0,
  featured_image TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(family_id, slug)
);

-- Story versions (for version history)
CREATE TABLE story_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  title TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  change_summary TEXT
);

-- Story-People junction (people mentioned in stories)
CREATE TABLE story_people (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  relationship TEXT,
  UNIQUE(story_id, person_id)
);

-- Story comments
CREATE TABLE story_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL,
  parent_id UUID REFERENCES story_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Timeline events
CREATE TABLE timeline_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  end_date DATE,
  location TEXT,
  event_type event_type NOT NULL DEFAULT 'custom',
  significance TEXT NOT NULL DEFAULT 'personal' CHECK (significance IN ('personal', 'family', 'historical', 'milestone')),
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Timeline event people
CREATE TABLE timeline_event_people (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES timeline_events(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  UNIQUE(event_id, person_id)
);

-- Timeline event media
CREATE TABLE timeline_event_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES timeline_events(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('image', 'document', 'audio', 'video')),
  url TEXT NOT NULL,
  thumbnail TEXT,
  caption TEXT
);

-- Media files
CREATE TABLE media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  type TEXT NOT NULL CHECK (type IN ('image', 'document', 'audio', 'video')),
  url TEXT NOT NULL,
  thumbnail TEXT,
  filename TEXT NOT NULL,
  size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  ocr_text TEXT,
  tags TEXT[] DEFAULT '{}',
  people_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Memories / Testimonies
CREATE TABLE memories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id),
  person_id UUID REFERENCES people(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  memory_type memory_type NOT NULL DEFAULT 'memory',
  date DATE,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Autobiography sessions
CREATE TABLE autobiography_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  interviewer_id UUID REFERENCES auth.users(id),
  status autobiography_status NOT NULL DEFAULT 'not_started',
  current_chapter INT DEFAULT 1,
  total_chapters INT DEFAULT 12,
  completed_chapters INT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Autobiography responses
CREATE TABLE autobiography_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES autobiography_sessions(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  response TEXT NOT NULL,
  audio_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chapters (for book compiler)
CREATE TABLE chapters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT,
  order_index INT NOT NULL DEFAULT 0,
  status chapter_status NOT NULL DEFAULT 'planned',
  word_count INT DEFAULT 0,
  stories UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Books (compiled family books)
CREATE TABLE books (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  subtitle TEXT,
  cover_image TEXT,
  status book_status NOT NULL DEFAULT 'draft',
  format book_format NOT NULL DEFAULT 'pdf',
  chapter_ids UUID[] DEFAULT '{}',
  settings JSONB NOT NULL DEFAULT '{
    "pageSize": "letter",
    "margins": {"top": 72, "bottom": 72, "left": 72, "right": 72},
    "fontFamily": "serif",
    "fontSize": 11,
    "lineHeight": 1.6,
    "includeTableOfContents": true,
    "includeIndex": true,
    "includePhotos": true,
    "coverStyle": "classic"
  }'::jsonb,
  generated_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity log
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_family_members_family ON family_members(family_id);
CREATE INDEX IF NOT EXISTS idx_family_members_user ON family_members(user_id);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_people_family ON people(family_id);
CREATE INDEX IF NOT EXISTS idx_people_slug ON people(family_id, slug);
CREATE INDEX IF NOT EXISTS idx_relationships_person ON relationships(person_id);
CREATE INDEX IF NOT EXISTS idx_relationships_related ON relationships(related_person_id);
CREATE INDEX IF NOT EXISTS idx_stories_family ON stories(family_id);
CREATE INDEX IF NOT EXISTS idx_stories_author ON stories(author_id);
CREATE INDEX IF NOT EXISTS idx_stories_slug ON stories(family_id, slug);
CREATE INDEX IF NOT EXISTS idx_stories_status ON stories(status);
CREATE INDEX IF NOT EXISTS idx_story_versions_story ON story_versions(story_id);
CREATE INDEX IF NOT EXISTS idx_timeline_events_family ON timeline_events(family_id);
CREATE INDEX IF NOT EXISTS idx_timeline_events_date ON timeline_events(date);
CREATE INDEX IF NOT EXISTS idx_media_family ON media(family_id);
CREATE INDEX IF NOT EXISTS idx_documents_family ON documents(family_id);
CREATE INDEX IF NOT EXISTS idx_memories_family ON memories(family_id);
CREATE INDEX IF NOT EXISTS idx_autobiography_sessions_family ON autobiography_sessions(family_id);
CREATE INDEX IF NOT EXISTS idx_chapters_family ON chapters(family_id);
CREATE INDEX IF NOT EXISTS idx_books_family ON books(family_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_family ON activity_log(family_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_user ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON activity_log(created_at DESC);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_stories_search ON stories USING GIN (
  to_tsvector('english', title || ' ' || content || ' ' || COALESCE(excerpt, ''))
);
CREATE INDEX IF NOT EXISTS idx_people_search ON people USING GIN (
  to_tsvector('english', name || ' ' || COALESCE(bio, '') || ' ' || COALESCE(birth_place, '') || ' ' || COALESCE(death_place, ''))
);
CREATE INDEX IF NOT EXISTS idx_timeline_search ON timeline_events USING GIN (
  to_tsvector('english', title || ' ' || COALESCE(description, '') || ' ' || COALESCE(location, ''))
);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_families_updated_at ON families;
DROP TRIGGER IF EXISTS update_people_updated_at ON people;
DROP TRIGGER IF EXISTS update_stories_updated_at ON stories;
DROP TRIGGER IF EXISTS update_timeline_events_updated_at ON timeline_events;
DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
DROP TRIGGER IF EXISTS update_memories_updated_at ON memories;
DROP TRIGGER IF EXISTS update_autobiography_sessions_updated_at ON autobiography_sessions;
DROP TRIGGER IF EXISTS update_chapters_updated_at ON chapters;
DROP TRIGGER IF EXISTS update_books_updated_at ON books;

CREATE TRIGGER update_families_updated_at BEFORE UPDATE ON families FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_people_updated_at BEFORE UPDATE ON people FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stories_updated_at BEFORE UPDATE ON stories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_timeline_events_updated_at BEFORE UPDATE ON timeline_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_memories_updated_at BEFORE UPDATE ON memories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_autobiography_sessions_updated_at BEFORE UPDATE ON autobiography_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chapters_updated_at BEFORE UPDATE ON chapters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON books FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_event_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_event_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE autobiography_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE autobiography_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Family policies
CREATE POLICY "Users can view families they belong to" ON families
  FOR SELECT USING (
    id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "Owners can update family" ON families
  FOR UPDATE USING (
    created_by = auth.uid() OR
    id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active')
  );

-- Family members policies
CREATE POLICY "Members can view family members" ON family_members
  FOR SELECT USING (
    family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "Admins can manage members" ON family_members
  FOR ALL USING (
    family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active')
  );

-- Invitations policies
CREATE POLICY "Admins can manage invitations" ON invitations
  FOR ALL USING (
    family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active')
  );

-- People policies
CREATE POLICY "Family members can view people" ON people
  FOR SELECT USING (
    family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "Editors can manage people" ON people
  FOR ALL USING (
    family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor') AND status = 'active')
  );

-- Relationships policies
CREATE POLICY "Family members can view relationships" ON relationships
  FOR SELECT USING (
    family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "Editors can manage relationships" ON relationships
  FOR ALL USING (
    family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor') AND status = 'active')
  );

-- Stories policies
CREATE POLICY "Family members can view published stories" ON stories
  FOR SELECT USING (
    family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid() AND status = 'active')
    AND (visibility = 'family' OR visibility = 'public' OR author_id = auth.uid())
  );

CREATE POLICY "Contributors can create stories" ON stories
  FOR INSERT WITH CHECK (
    family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor', 'contributor') AND status = 'active')
    AND author_id = auth.uid()
  );

CREATE POLICY "Authors and editors can update stories" ON stories
  FOR UPDATE USING (
    author_id = auth.uid() OR
    family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor') AND status = 'active')
  );

-- Story versions policies
CREATE POLICY "Story authors can view versions" ON story_versions
  FOR SELECT USING (
    story_id IN (SELECT id FROM stories WHERE author_id = auth.uid() OR family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor') AND status = 'active'))
  );

-- Timeline events policies
CREATE POLICY "Family members can view timeline events" ON timeline_events
  FOR SELECT USING (
    family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "Contributors can create timeline events" ON timeline_events
  FOR INSERT WITH CHECK (
    family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor', 'contributor') AND status = 'active')
    AND created_by = auth.uid()
  );

CREATE POLICY "Editors can update timeline events" ON timeline_events
  FOR UPDATE USING (
    created_by = auth.uid() OR
    family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor') AND status = 'active')
  );

-- Media policies
CREATE POLICY "Family members can view media" ON media
  FOR SELECT USING (
    family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "Contributors can upload media" ON media
  FOR INSERT WITH CHECK (
    family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor', 'contributor') AND status = 'active')
    AND uploaded_by = auth.uid()
  );

-- Documents policies
CREATE POLICY "Family members can view documents" ON documents
  FOR SELECT USING (
    family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "Contributors can upload documents" ON documents
  FOR INSERT WITH CHECK (
    family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor', 'contributor') AND status = 'active')
    AND uploaded_by = auth.uid()
  );

-- Memories policies
CREATE POLICY "Family members can view memories" ON memories
  FOR SELECT USING (
    family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "Contributors can create memories" ON memories
  FOR INSERT WITH CHECK (
    family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor', 'contributor') AND status = 'active')
    AND author_id = auth.uid()
  );

-- Autobiography policies
CREATE POLICY "Family members can view sessions" ON autobiography_sessions
  FOR SELECT USING (
    family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "Interviewers can manage sessions" ON autobiography_sessions
  FOR ALL USING (
    interviewer_id = auth.uid() OR
    family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor') AND status = 'active')
  );

-- Chapters policies
CREATE POLICY "Family members can view chapters" ON chapters
  FOR SELECT USING (
    family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "Editors can manage chapters" ON chapters
  FOR ALL USING (
    family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor') AND status = 'active')
  );

-- Books policies
CREATE POLICY "Family members can view books" ON books
  FOR SELECT USING (
    family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "Editors can manage books" ON books
  FOR ALL USING (
    family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor') AND status = 'active')
  );

-- Activity log policies
CREATE POLICY "Family members can view activity" ON activity_log
  FOR SELECT USING (
    family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid() AND status = 'active')
  );