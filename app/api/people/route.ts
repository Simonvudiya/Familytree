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

  const { data, error } = await supabase
    .from("people")
    .select("*")
    .eq("family_id", familyId)
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ people: data });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { family_id, name, sex, birth_date, birth_place, death_date, death_place, bio, is_living, profile_image, parent_ids, spouse_ids } = body;

    if (!family_id || !name) {
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

    if (!membership || !["owner", "admin", "editor"].includes(membership.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const { data: person, error } = await supabase
      .from("people")
      .insert({
        family_id,
        created_by: user.id,
        name,
        slug,
        sex,
        birth_date,
        birth_place,
        death_date,
        death_place,
        bio,
        profile_image,
        is_living: is_living !== false,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (parent_ids?.length) {
      await supabase.from("relationships").insert(
        parent_ids.map((parent_id: string) => ({
          family_id,
          person_id: parent_id,
          related_person_id: person.id,
          type: "parent",
        }))
      );
    }

    if (spouse_ids?.length) {
      await supabase.from("relationships").insert(
        spouse_ids.map((spouse_id: string) => ({
          family_id,
          person_id: person.id,
          related_person_id: spouse_id,
          type: "spouse",
        }))
      );
    }

    // Log activity
    await supabase.from("activity_log").insert({
      family_id,
      user_id: user.id,
      action: "create",
      entity_type: "person",
      entity_id: person.id,
      description: `Added family member "${name}"`,
    });

    return NextResponse.json({ person }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}