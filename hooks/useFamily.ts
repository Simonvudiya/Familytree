"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Family, FamilyMember, UserRole } from "@/types/family";
import { useUser } from "./useUser";

export function useFamily() {
  const { user } = useUser();
  const [family, setFamily] = useState<Family | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFamily = useCallback(async () => {
    if (!user) {
      setFamily(null);
      setMembers([]);
      setRole(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const supabase = createClient();

      const { data: memberData, error: memberError } = await supabase
        .from("family_members")
        .select("*, families(*)")
        .eq("user_id", user.id)
        .eq("status", "active")
        .single();

      if (memberError || !memberData) {
        setFamily(null);
        setMembers([]);
        setRole(null);
        return;
      }

      setFamily(memberData.families as Family);
      setRole(memberData.role);

      const { data: allMembers } = await supabase
        .from("family_members")
        .select("*, profiles:user_id(id, full_name, avatar_url, email)")
        .eq("family_id", memberData.family_id)
        .eq("status", "active");

      setMembers(allMembers || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load family");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFamily();
  }, [fetchFamily]);

  const inviteMember = async (email: string, role: UserRole) => {
    const supabase = createClient();
    if (!family) throw new Error("No family selected");

    const { data, error } = await supabase
      .from("invitations")
      .insert({
        family_id: family.id,
        email,
        role,
        invited_by: user?.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const updateMemberRole = async (memberId: string, newRole: UserRole) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("family_members")
      .update({ role: newRole })
      .eq("id", memberId);

    if (error) throw error;
    await fetchFamily();
  };

  const removeMember = async (memberId: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("family_members")
      .update({ status: "removed" })
      .eq("id", memberId);

    if (error) throw error;
    await fetchFamily();
  };

  const can = (requiredRoles: UserRole[]): boolean => {
    if (!role) return false;
    const roleHierarchy: Record<UserRole, number> = {
      owner: 5,
      admin: 4,
      editor: 3,
      contributor: 2,
      viewer: 1,
    };
    return requiredRoles.some((r) => roleHierarchy[role] >= roleHierarchy[r]);
  };

  return {
    family,
    members,
    role,
    loading,
    error,
    refetch: fetchFamily,
    inviteMember,
    updateMemberRole,
    removeMember,
    can,
  };
}