export interface Person {
  id: string;
  family_id: string;
  created_by: string;
  name: string;
  slug: string;
  sex?: "male" | "female" | "other";
  birth_date?: string;
  birth_place?: string;
  death_date?: string;
  death_place?: string;
  bio?: string;
  profile_image?: string;
  is_living: boolean;
  generation?: number;
  created_at: string;
  updated_at: string;

  // Relationships (populated via joins)
  parents?: Person[];
  children?: Person[];
  spouses?: Person[];
  siblings?: Person[];
}

export interface Relationship {
  id: string;
  family_id: string;
  person_id: string;
  related_person_id: string;
  type: RelationshipType;
  created_at: string;
}

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

export interface PersonFormData {
  name: string;
  sex?: "male" | "female" | "other";
  birth_date?: string;
  birth_place?: string;
  death_date?: string;
  death_place?: string;
  bio?: string;
  is_living: boolean;
  profile_image?: File | string;
  parent_ids?: string[];
  spouse_ids?: string[];
}