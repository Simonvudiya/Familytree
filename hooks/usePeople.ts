"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Person, PersonFormData, RelationshipType } from "@/types/person";
import { useFamily } from "./useFamily";

export function usePeople() {
  const { family } = useFamily();
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPeople = useCallback(async () => {
    if (!family) return;
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("people")
        .select("*")
        .eq("family_id", family.id)
        .order("name");

      if (error) throw error;
      setPeople(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load people");
    } finally {
      setLoading(false);
    }
  }, [family]);

  const fetchPerson = useCallback(async (id: string) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("people")
      .select(`
        *,
        relationships:relationships!person_id(type, related_person:related_person_id(*)),
        reverse_relationships:relationships!related_person_id(type, person:person_id(*))
      `)
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  }, []);

  const createPerson = async (data: PersonFormData) => {
    if (!family) throw new Error("No family selected");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    let profileImageUrl = data.profile_image;
    if (data.profile_image instanceof File) {
      const fileName = `${crypto.randomUUID()}.${data.profile_image.name.split(".").pop()}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("family-photos")
        .upload(`${family.id}/${fileName}`, data.profile_image);

      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("family-photos").getPublicUrl(uploadData.path);
      profileImageUrl = urlData.publicUrl;
    }

    const { data: person, error } = await supabase
      .from("people")
      .insert({
        family_id: family.id,
        created_by: user?.id,
        name: data.name,
        slug,
        sex: data.sex,
        birth_date: data.birth_date,
        birth_place: data.birth_place,
        death_date: data.death_date,
        death_place: data.death_place,
        bio: data.bio,
        profile_image: profileImageUrl,
        is_living: data.is_living,
      })
      .select()
      .single();

    if (error) throw error;

    if (data.parent_ids?.length) {
      await supabase.from("relationships").insert(
        data.parent_ids.map((parent_id) => ({
          family_id: family.id,
          person_id: parent_id,
          related_person_id: person.id,
          type: "parent" as RelationshipType,
        }))
      );
    }

    if (data.spouse_ids?.length) {
      await supabase.from("relationships").insert(
        data.spouse_ids.map((spouse_id) => ({
          family_id: family.id,
          person_id: person.id,
          related_person_id: spouse_id,
          type: "spouse" as RelationshipType,
        }))
      );
    }

    await fetchPeople();
    return person;
  };

  const updatePerson = async (id: string, data: Partial<PersonFormData>) => {
    const supabase = createClient();

    let profileImageUrl = data.profile_image;
    if (data.profile_image instanceof File) {
      const fileName = `${crypto.randomUUID()}.${data.profile_image.name.split(".").pop()}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("family-photos")
        .upload(`${family?.id}/${fileName}`, data.profile_image);

      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("family-photos").getPublicUrl(uploadData.path);
      profileImageUrl = urlData.publicUrl;
    }

    const updates: Record<string, unknown> = { ...data };
    if (data.name) {
      updates.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    }
    if (profileImageUrl) updates.profile_image = profileImageUrl;
    delete updates.profile_image;

    const { error } = await supabase.from("people").update(updates).eq("id", id);
    if (error) throw error;

    await fetchPeople();
  };

  const deletePerson = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from("people").delete().eq("id", id);
    if (error) throw error;
    await fetchPeople();
  };

  const addRelationship = async (personId: string, relatedPersonId: string, type: RelationshipType) => {
    if (!family) throw new Error("No family selected");

    const supabase = createClient();
    const { error } = await supabase.from("relationships").insert({
      family_id: family.id,
      person_id: personId,
      related_person_id: relatedPersonId,
      type,
    });
    if (error) throw error;
  };

  const removeRelationship = async (personId: string, relatedPersonId: string, type: RelationshipType) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("relationships")
      .delete()
      .eq("person_id", personId)
      .eq("related_person_id", relatedPersonId)
      .eq("type", type);
    if (error) throw error;
  };

  return {
    people,
    loading,
    error,
    fetchPeople,
    fetchPerson,
    createPerson,
    updatePerson,
    deletePerson,
    addRelationship,
    removeRelationship,
  };
}