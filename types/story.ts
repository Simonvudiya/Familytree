export interface Story {
  id: string;
  family_id: string;
  author_id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  event_date?: string | null;
  event_year?: number | null;
  category?: string | null;
  location?: string | null;
  status: StoryStatus;
  visibility: StoryVisibility;
  tags: string[];
  word_count: number;
  reading_time: number;
  featured_image?: string;
  published_at?: string;
  created_at: string;
  updated_at: string;

  // Relations
  author?: { id: string; full_name: string; avatar_url?: string };
  people?: PersonRef[];
  timeline_events?: TimelineEventRef[];
  versions?: StoryVersion[];
}

export type StoryStatus = "draft" | "review" | "published" | "archived";
export type StoryVisibility = "private" | "family" | "public";

export interface StoryVersion {
  id: string;
  story_id: string;
  content: string;
  title: string;
  created_by: string;
  created_at: string;
  change_summary?: string;
}

export interface PersonRef {
  id: string;
  name: string;
  birth_year?: number;
  death_year?: number;
  relationship?: string;
}

export interface TimelineEventRef {
  id: string;
  title: string;
  date: string;
}

export interface StoryFormData {
  title: string;
  content: string;
  excerpt?: string;
  event_date?: string;
  event_year?: number;
  category?: string;
  location?: string;
  status: StoryStatus;
  visibility: StoryVisibility;
  tags: string[];
  featured_image?: File;
  people_ids?: string[];
  event_ids?: string[];
}

export interface StoryComment {
  id: string;
  story_id: string;
  user_id: string;
  content: string;
  parent_id?: string;
  created_at: string;
  updated_at: string;
  user?: { id: string; full_name: string; avatar_url?: string };
  replies?: StoryComment[];
}