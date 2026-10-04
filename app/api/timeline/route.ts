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
  const startDate = searchParams.get("start_date");
  const endDate = searchParams.get("end_date");
  const eventTypes = searchParams.get("event_types")?.split(",");

  if (!familyId) {
    return NextResponse.json({ error: "Family ID required" }, { status: 400 });
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

  let query = supabase
    .from("timeline_events")
    .select(`
      *,
      timeline_event_people(people:person_id(id, name, birth_date, death_date)),
      timeline_event_media(*)
    `)
    .eq("family_id", familyId)
    .order("date", { ascending: true });

  if (startDate) {
    query = query.gte("date", startDate);
  }
  if (endDate) {
    query = query.lte("date", endDate);
  }
  if (eventTypes?.length) {
    query = query.in("event_type", eventTypes);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ events: data });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { family_id, title, description, date, end_date, location, event_type, significance, tags, people_ids } = body;

    if (!family_id || !title || !date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify membership
    const { data: membership } = await supabase
      .from("family_members")
      .select("role")
      .eq("family_id", family_id)
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (!membership || !["owner", "admin", "editor", "contributor"].includes(membership.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: event, error } = await supabase
      .from("timeline_events")
      .insert({
        family_id,
        created_by: user.id,
        title,
        description,
        date,
        end_date,
        location,
        event_type: event_type || "custom",
        significance: significance || "personal",
        tags: tags || [],
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (people_ids?.length) {
      await supabase.from("timeline_event_people").insert(
        people_ids.map((person_id: string) => ({ event_id: event.id, person_id }))
      );
    }

    // Log activity
    await supabase.from("activity_log").insert({
      family_id,
      user_id: user.id,
      action: "create",
      entity_type: "timeline_event",
      entity_id: event.id,
      description: `Added timeline event "${title}"`,
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}