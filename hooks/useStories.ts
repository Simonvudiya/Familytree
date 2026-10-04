"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Story, StoryFormData, StoryStatus, StoryVisibility } from "@/types/story";
import { useFamily } from "./useFamily";

export function useStories() {
  const { family } = useFamily();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStories = useCallback(async (options?: { status?: StoryStatus; limit?: number; offset?: number }) => {
    if (!family) return;
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      let query = supabase
        .from("stories")
        .select(`
          *,
          author:profiles!author_id(id, full_name, avatar_url),
          story_people(people:person_id(id, name, birth_date, death_date))
        `)
        .eq("family_id", family.id)
        .order("updated_at", { ascending: false });

      if (options?.status) {
        query = query.eq("status", options.status);
      }
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error } = await query;
      if (error) throw error;
      setStories(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stories");
    } finally {
      setLoading(false);
    }
  }, [family]);

  const createStory = async (data: StoryFormData) => {
    if (!family) throw new Error("No family selected");

    const supabase = createClient();
    const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const wordCount = data.content.split(/\s+/).filter(Boolean).length;
    const readingTime = Math.ceil(wordCount / 200);

    const { data: story, error } = await supabase
      .from("stories")
      .insert({
        family_id: family.id,
        author_id: (await supabase.auth.getUser()).data.user?.id,
        title: data.title,
        slug,
        content: data.content,
        excerpt: data.excerpt,
        event_date: data.event_date || null,
        event_year: data.event_year ?? null,
        category: data.category || null,
        location: data.location || null,
        status: data.status,
        visibility: data.visibility,
        tags: data.tags,
        word_count: wordCount,
        reading_time: readingTime,
      })
      .select()
      .single();

    if (error) throw error;

    if (data.people_ids?.length) {
      await supabase.from("story_people").insert(
        data.people_ids.map((person_id) => ({ story_id: story.id, person_id }))
      );
    }

    await fetchStories();
    return story;
  };

  const updateStory = async (id: string, data: Partial<StoryFormData>) => {
    const supabase = createClient();

    const updates: Record<string, unknown> = { ...data };
    if (data.content) {
      const wordCount = data.content.split(/\s+/).filter(Boolean).length;
      updates.word_count = wordCount;
      updates.reading_time = Math.ceil(wordCount / 200);
    }
    if (data.title) {
      updates.slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    }

    const { error } = await supabase.from("stories").update(updates).eq("id", id);
    if (error) throw error;

    if (data.people_ids) {
      await supabase.from("story_people").delete().eq("story_id", id);
      await supabase.from("story_people").insert(
        data.people_ids.map((person_id) => ({ story_id: id, person_id }))
      );
    }

    await fetchStories();
  };

  const deleteStory = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from("stories").delete().eq("id", id);
    if (error) throw error;
    await fetchStories();
  };

  const createVersion = async (storyId: string, content: string, title: string, changeSummary?: string) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from("story_versions").insert({
      story_id: storyId,
      content,
      title,
      created_by: user?.id,
      change_summary: changeSummary,
    });

    if (error) throw error;
  };

  const getVersions = async (storyId: string) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("story_versions")
      .select("*")
      .eq("story_id", storyId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  };

  return {
    stories,
    loading,
    error,
    fetchStories,
    createStory,
    updateStory,
    deleteStory,
    createVersion,
    getVersions,
  };
}