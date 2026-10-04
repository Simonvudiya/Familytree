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
  const status = searchParams.get("status");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = parseInt(searchParams.get("offset") || "0");

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
    .from("stories")
    .select(`
      *,
      author:profiles!author_id(id, full_name, avatar_url)
    `)
    .eq("family_id", familyId)
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ stories: data, count });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { family_id, title, content, excerpt, status, visibility, tags, people_ids } = body;

    if (!family_id || !title || !content) {
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

    const wordCount = content.split(/\s+/).filter(Boolean).length;
    const readingTime = Math.ceil(wordCount / 200);
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const { data: story, error } = await supabase
      .from("stories")
      .insert({
        family_id,
        author_id: user.id,
        title,
        slug,
        content,
        excerpt,
        status: status || "draft",
        visibility: visibility || "family",
        tags: tags || [],
        word_count: wordCount,
        reading_time: readingTime,
        published_at: status === "published" ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (people_ids?.length) {
      await supabase.from("story_people").insert(
        people_ids.map((person_id: string) => ({ story_id: story.id, person_id }))
      );
    }

    // Log activity
    await supabase.from("activity_log").insert({
      family_id,
      user_id: user.id,
      action: "create",
      entity_type: "story",
      entity_id: story.id,
      description: `Created story "${title}"`,
    });

    return NextResponse.json({ story }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}