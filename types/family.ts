export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  role: UserRole;
  family_id?: string;
}

export type UserRole = "owner" | "admin" | "editor" | "viewer" | "contributor";

export interface Family {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  settings: FamilySettings;
}

export interface FamilySettings {
  allow_member_invite: boolean;
  require_approval: boolean;
  default_member_role: UserRole;
  visibility: "private" | "family" | "public";
}

export interface FamilyMember {
  id: string;
  family_id: string;
  user_id: string;
  role: UserRole;
  status: "pending" | "active" | "removed";
  joined_at: string;
  invited_by?: string;
}

export interface Invitation {
  id: string;
  family_id: string;
  email: string;
  role: UserRole;
  token: string;
  status: "pending" | "accepted" | "expired" | "revoked";
  expires_at: string;
  created_at: string;
  invited_by: string;
}