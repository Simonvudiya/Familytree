export interface TimelineEvent {
  id: string;
  family_id: string;
  created_by: string;
  title: string;
  description?: string;
  date: string;
  end_date?: string;
  location?: string;
  event_type: EventType;
  significance: "personal" | "family" | "historical" | "milestone";
  tags: string[];
  media: MediaRef[];
  people: PersonRef[];
  timeline_event_people?: { people: { id: string; name: string } }[];
  timeline_event_media?: MediaRef[];
  created_at: string;
  updated_at: string;
}

export type EventType =
  | "birth"
  | "death"
  | "marriage"
  | "divorce"
  | "graduation"
  | "career"
  | "military"
  | "migration"
  | "achievement"
  | "historical"
  | "custom";

export interface MediaRef {
  id: string;
  type: "image" | "document" | "audio" | "video";
  url: string;
  thumbnail?: string;
  caption?: string;
}

export interface PersonRef {
  id: string;
  name: string;
  birth_year?: number;
  death_year?: number;
}

export interface TimelineEventFormData {
  title: string;
  description?: string;
  date: string;
  end_date?: string;
  location?: string;
  event_type: EventType;
  significance: "personal" | "family" | "historical" | "milestone";
  tags: string[];
  people_ids: string[];
  media_files?: File[];
}

export interface TimelineFilter {
  dateRange?: { start: string; end: string };
  eventTypes?: EventType[];
  peopleIds?: string[];
  tags?: string[];
  significance?: string[];
}