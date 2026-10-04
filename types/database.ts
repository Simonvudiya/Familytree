export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      families: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
          settings: FamilySettings;
        };
        Insert: Omit<Database["public"]["Tables"]["families"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["families"]["Insert"]>;
      };
      family_members: {
        Row: {
          id: string;
          family_id: string;
          user_id: string;
          role: UserRole;
          status: "pending" | "active" | "removed";
          joined_at: string;
          invited_by: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["family_members"]["Row"], "id" | "joined_at">;
        Update: Partial<Database["public"]["Tables"]["family_members"]["Insert"]>;
      };
      invitations: {
        Row: {
          id: string;
          family_id: string;
          email: string;
          role: UserRole;
          token: string;
          status: "pending" | "accepted" | "expired" | "revoked";
          expires_at: string;
          created_at: string;
          invited_by: string;
        };
        Insert: Omit<Database["public"]["Tables"]["invitations"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["invitations"]["Insert"]>;
      };
      people: {
        Row: {
          id: string;
          family_id: string;
          created_by: string;
          name: string;
          slug: string;
          sex: "male" | "female" | "other" | null;
          birth_date: string | null;
          birth_place: string | null;
          death_date: string | null;
          death_place: string | null;
          bio: string | null;
          profile_image: string | null;
          is_living: boolean;
          generation: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["people"]["Row"], "id" | "created_at" | "updated_at" | "slug">;
        Update: Partial<Database["public"]["Tables"]["people"]["Insert"]>;
      };
      relationships: {
        Row: {
          id: string;
          family_id: string;
          person_id: string;
          related_person_id: string;
          type: RelationshipType;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["relationships"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["relationships"]["Insert"]>;
      };
      stories: {
        Row: {
          id: string;
          family_id: string;
          author_id: string;
          title: string;
          slug: string;
          content: string;
          excerpt: string | null;
          event_date: string | null;
          event_year: number | null;
          category: string | null;
          location: string | null;
          status: StoryStatus;
          visibility: StoryVisibility;
          tags: string[];
          word_count: number;
          reading_time: number;
          featured_image: string | null;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["stories"]["Row"], "id" | "created_at" | "updated_at" | "slug" | "word_count" | "reading_time" | "event_date" | "event_year" | "category" | "location"> &
          Partial<Pick<Database["public"]["Tables"]["stories"]["Row"], "event_date" | "event_year" | "category" | "location">>;
        Update: Partial<Database["public"]["Tables"]["stories"]["Insert"]>;
      };
      story_versions: {
        Row: {
          id: string;
          story_id: string;
          content: string;
          title: string;
          created_by: string;
          created_at: string;
          change_summary: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["story_versions"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["story_versions"]["Insert"]>;
      };
      story_people: {
        Row: {
          id: string;
          story_id: string;
          person_id: string;
          relationship: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["story_people"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["story_people"]["Insert"]>;
      };
      story_comments: {
        Row: {
          id: string;
          story_id: string;
          user_id: string;
          content: string;
          parent_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["story_comments"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["story_comments"]["Insert"]>;
      };
      timeline_events: {
        Row: {
          id: string;
          family_id: string;
          created_by: string;
          title: string;
          description: string | null;
          date: string;
          end_date: string | null;
          location: string | null;
          event_type: EventType;
          significance: "personal" | "family" | "historical" | "milestone";
          tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["timeline_events"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["timeline_events"]["Insert"]>;
      };
      timeline_event_people: {
        Row: {
          id: string;
          event_id: string;
          person_id: string;
        };
        Insert: Omit<Database["public"]["Tables"]["timeline_event_people"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["timeline_event_people"]["Insert"]>;
      };
      timeline_event_media: {
        Row: {
          id: string;
          event_id: string;
          type: "image" | "document" | "audio" | "video";
          url: string;
          thumbnail: string | null;
          caption: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["timeline_event_media"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["timeline_event_media"]["Insert"]>;
      };
      media: {
        Row: {
          id: string;
          family_id: string;
          uploaded_by: string;
          type: "image" | "document" | "audio" | "video";
          url: string;
          thumbnail: string | null;
          filename: string;
          size: number;
          mime_type: string;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["media"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["media"]["Insert"]>;
      };
      documents: {
        Row: {
          id: string;
          family_id: string;
          uploaded_by: string;
          title: string;
          description: string | null;
          file_url: string;
          thumbnail_url: string | null;
          file_type: string;
          file_size: number;
          ocr_text: string | null;
          tags: string[];
          people_ids: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["documents"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["documents"]["Insert"]>;
      };
      memories: {
        Row: {
          id: string;
          family_id: string;
          author_id: string;
          person_id: string | null;
          title: string;
          content: string;
          memory_type: "testimony" | "memory" | "quote" | "recipe" | "tradition" | "custom";
          date: string | null;
          tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["memories"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["memories"]["Insert"]>;
      };
      autobiography_sessions: {
        Row: {
          id: string;
          family_id: string;
          person_id: string;
          interviewer_id: string | null;
          status: "not_started" | "in_progress" | "completed" | "archived";
          current_chapter: number;
          total_chapters: number;
          completed_chapters: number[];
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["autobiography_sessions"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["autobiography_sessions"]["Insert"]>;
      };
      autobiography_responses: {
        Row: {
          id: string;
          session_id: string;
          question_id: string;
          response: string;
          audio_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["autobiography_responses"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["autobiography_responses"]["Insert"]>;
      };
      chapters: {
        Row: {
          id: string;
          family_id: string;
          created_by: string;
          title: string;
          description: string | null;
          order_index: number;
          status: "planned" | "writing" | "review" | "finalized";
          word_count: number;
          stories: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["chapters"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["chapters"]["Insert"]>;
      };
      books: {
        Row: {
          id: string;
          family_id: string;
          created_by: string;
          title: string;
          subtitle: string | null;
          cover_image: string | null;
          status: "draft" | "compiling" | "ready" | "published";
          format: "pdf" | "docx" | "epub" | "print";
          chapter_ids: string[];
          settings: BookSettings;
          generated_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["books"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["books"]["Insert"]>;
      };
      activity_log: {
        Row: {
          id: string;
          family_id: string;
          user_id: string;
          action: string;
          entity_type: string;
          entity_id: string;
          description: string;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["activity_log"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["activity_log"]["Insert"]>;
      };
    };
    Views: {
      family_tree: {
        Row: {
          id: string;
          name: string;
          sex: string | null;
          birth_date: string | null;
          death_date: string | null;
          profile_image: string | null;
          generation: number | null;
          parent_ids: string[];
          spouse_ids: string[];
          child_ids: string[];
        };
      };
    };
    Functions: {
      create_family_for_current_user: {
        Args: { family_name: string };
        Returns: string;
      };
      get_family_invitation: {
        Args: { invitation_token: string };
        Returns: {
          email: string;
          role: UserRole;
          family_name: string;
          inviter_name: string;
          expires_at: string;
        }[];
      };
      accept_family_invitation: {
        Args: { invitation_token: string };
        Returns: boolean;
      };
      generate_slug: {
        Args: { input: string };
        Returns: string;
      };
      calculate_generation: {
        Args: { person_id: string };
        Returns: number;
      };
      get_family_tree: {
        Args: { family_id: string; root_person_id?: string };
        Returns: Database["public"]["Views"]["family_tree"]["Row"][];
      };
      search_family: {
        Args: { family_id: string; query: string; limit?: number };
        Returns: {
          id: string;
          type: "person" | "story" | "event" | "memory" | "document";
          title: string;
          snippet: string;
          url: string;
        }[];
      };
    };
    Enums: {
      user_role: "owner" | "admin" | "editor" | "viewer" | "contributor";
      story_status: "draft" | "review" | "published" | "archived";
      story_visibility: "private" | "family" | "public";
      relationship_type: RelationshipType;
      event_type: EventType;
      memory_type: "testimony" | "memory" | "quote" | "recipe" | "tradition" | "custom";
      autobiography_status: "not_started" | "in_progress" | "completed" | "archived";
      chapter_status: "planned" | "writing" | "review" | "finalized";
      book_status: "draft" | "compiling" | "ready" | "published";
      book_format: "pdf" | "docx" | "epub" | "print";
    };
  };
}

export type FamilySettings = {
  allow_member_invite: boolean;
  require_approval: boolean;
  default_member_role: UserRole;
  visibility: "private" | "family" | "public";
};

export type UserRole = "owner" | "admin" | "editor" | "viewer" | "contributor";
export type StoryStatus = "draft" | "review" | "published" | "archived";
export type StoryVisibility = "private" | "family" | "public";
export type RelationshipType =
  | "parent"
  | "child"
  | "spouse"
  | "partner"
  | "sibling"
  | "half-sibling"
  | "adoptive-parent"
  | "adoptive-child"
  | "step-parent"
  | "step-child"
  | "godparent"
  | "godchild";
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
export type BookSettings = {
  pageSize: "letter" | "a4";
  margins: { top: number; bottom: number; left: number; right: number };
  fontFamily: "serif" | "sans-serif";
  fontSize: number;
  lineHeight: number;
  includeTableOfContents: boolean;
  includeIndex: boolean;
  includePhotos: boolean;
  coverStyle: "classic" | "modern" | "minimal";
};