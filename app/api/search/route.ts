import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const familyId = searchParams.get("family_id");
  const query = searchParams.get("q");
  const limit = parseInt(searchParams.get("limit") || "20");

  if (!familyId || !query) {
    return NextResponse.json({ error: "Family ID and query required" }, { status: 400 });
  }

  // Verify user belongs to family
  const { data: membership } = await supabase
    .from("family_members")
    .select("role")
    .eq("family_id", familyId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .single();

  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Use the search function if available, otherwise do manual search
  try {
    const { data, error } = await supabase.rpc("search_family", {
      family_id: familyId,
      query,
      limit,
    });

    if (error) {
      // Fallback to manual search
      return manualSearch(supabase, familyId, query, limit);
    }

    return NextResponse.json({ results: data || [] });
  } catch {
    return manualSearch(supabase, familyId, query, limit);
  }
}

async function manualSearch(supabase: any, familyId: string, query: string, limit: number) {
  const searchTerm = `%${query}%`;

  const [peopleRes, storiesRes, eventsRes, memoriesRes, documentsRes] = await Promise.all([
    supabase
      .from("people")
      .select("id, name, birth_date, death_date, bio, profile_image")
      .eq("family_id", familyId)
      .or(`name.ilike.${searchTerm},bio.ilike.${searchTerm},birth_place.ilike.${searchTerm},death_place.ilike.${searchTerm}`)
      .limit(limit),
    supabase
      .from("stories")
      .select("id, title, excerpt, content, status, updated_at")
      .eq("family_id", familyId)
      .or(`title.ilike.${searchTerm},content.ilike.${searchTerm},excerpt.ilike.${searchTerm}`)
      .eq("status", "published")
      .limit(limit),
    supabase
      .from("timeline_events")
      .select("id, title, description, date, location, event_type")
      .eq("family_id", familyId)
      .or(`title.ilike.${searchTerm},description.ilike.${searchTerm},location.ilike.${searchTerm}`)
      .limit(limit),
    supabase
      .from("memories")
      .select("id, title, content, memory_type, date")
      .eq("family_id", familyId)
      .or(`title.ilike.${searchTerm},content.ilike.${searchTerm}`)
      .limit(limit),
    supabase
      .from("documents")
      .select("id, title, description, ocr_text")
      .eq("family_id", familyId)
      .or(`title.ilike.${searchTerm},description.ilike.${searchTerm},ocr_text.ilike.${searchTerm}`)
      .limit(limit),
  ]);

  const results = [
    ...(peopleRes.data || []).map((p: any) => ({
      id: p.id,
      type: "person",
      title: p.name,
      snippet: p.bio?.substring(0, 150) || `Born ${p.birth_date ? new Date(p.birth_date).getFullYear() : "?"}`,
      url: `/people/${p.id}`,
      image: p.profile_image,
    })),
    ...(storiesRes.data || []).map((s: any) => ({
      id: s.id,
      type: "story",
      title: s.title,
      snippet: s.excerpt?.substring(0, 150) || s.content.substring(0, 150),
      url: `/stories/${s.id}`,
    })),
    ...(eventsRes.data || []).map((e: any) => ({
      id: e.id,
      type: "event",
      title: e.title,
      snippet: `${e.event_type} on ${new Date(e.date).toLocaleDateString()}${e.location ? ` in ${e.location}` : ""}`,
      url: `/timeline?event=${e.id}`,
    })),
    ...(memoriesRes.data || []).map((m: any) => ({
      id: m.id,
      type: "memory",
      title: m.title,
      snippet: m.content.substring(0, 150),
      url: `/memories/${m.id}`,
    })),
    ...(documentsRes.data || []).map((d: any) => ({
      id: d.id,
      type: "document",
      title: d.title,
      snippet: d.description || d.ocr_text?.substring(0, 150) || "Document",
      url: `/documents/${d.id}`,
    })),
  ].slice(0, limit);

  return NextResponse.json({ results });
}