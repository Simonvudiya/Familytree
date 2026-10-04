"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { TimelineEvent, TimelineEventFormData, EventType } from "@/types/timeline";
import { useFamily } from "./useFamily";

export function useTimeline() {
  const { family } = useFamily();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async (options?: { startDate?: string; endDate?: string; eventTypes?: EventType[] }) => {
    if (!family) return;
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      let query = supabase
        .from("timeline_events")
        .select(`
          *,
          timeline_event_people(people:person_id(id, name, birth_date, death_date)),
          timeline_event_media(*)
        `)
        .eq("family_id", family.id)
        .order("date", { ascending: true });

      if (options?.startDate) {
        query = query.gte("date", options.startDate);
      }
      if (options?.endDate) {
        query = query.lte("date", options.endDate);
      }
      if (options?.eventTypes?.length) {
        query = query.in("event_type", options.eventTypes);
      }

      const { data, error } = await query;
      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load timeline events");
    } finally {
      setLoading(false);
    }
  }, [family]);

  const createEvent = async (data: TimelineEventFormData) => {
    if (!family) throw new Error("No family selected");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: event, error } = await supabase
      .from("timeline_events")
      .insert({
        family_id: family.id,
        created_by: user?.id,
        title: data.title,
        description: data.description,
        date: data.date,
        end_date: data.end_date,
        location: data.location,
        event_type: data.event_type,
        significance: data.significance,
        tags: data.tags,
      })
      .select()
      .single();

    if (error) throw error;

    if (data.people_ids?.length) {
      await supabase.from("timeline_event_people").insert(
        data.people_ids.map((person_id) => ({ event_id: event.id, person_id }))
      );
    }

    if (data.media_files?.length) {
      const mediaInserts = [];
      for (const file of data.media_files) {
        const fileName = `${crypto.randomUUID()}.${file.name.split(".").pop()}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("family-media")
          .upload(`${family.id}/timeline/${fileName}`, file);

        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("family-media").getPublicUrl(uploadData.path);

        mediaInserts.push({
          event_id: event.id,
          type: file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : "document",
          url: urlData.publicUrl,
        });
      }

      if (mediaInserts.length) {
        await supabase.from("timeline_event_media").insert(mediaInserts);
      }
    }

    await fetchEvents();
    return event;
  };

  const updateEvent = async (id: string, data: Partial<TimelineEventFormData>) => {
    const supabase = createClient();
    const { error } = await supabase.from("timeline_events").update(data).eq("id", id);
    if (error) throw error;

    if (data.people_ids) {
      await supabase.from("timeline_event_people").delete().eq("event_id", id);
      await supabase.from("timeline_event_people").insert(
        data.people_ids.map((person_id) => ({ event_id: id, person_id }))
      );
    }

    await fetchEvents();
  };

  const deleteEvent = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from("timeline_events").delete().eq("id", id);
    if (error) throw error;
    await fetchEvents();
  };

  const getEventsByDate = useCallback((date: string) => {
    return events.filter((e) => e.date === date || (e.end_date && e.date <= date && e.end_date >= date));
  }, [events]);

  const getEventsByPerson = useCallback((personId: string) => {
    return events.filter((e) => e.timeline_event_people?.some((p) => p.people.id === personId));
  }, [events]);

  return {
    events,
    loading,
    error,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    getEventsByDate,
    getEventsByPerson,
  };
}