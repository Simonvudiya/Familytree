import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { book_id, format = "pdf" } = body;

    if (!book_id) {
      return NextResponse.json({ error: "Book ID required" }, { status: 400 });
    }

    // Get book with chapters and stories
    const { data: book, error: bookError } = await supabase
      .from("books")
      .select("*")
      .eq("id", book_id)
      .single();

    if (bookError || !book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    // Verify membership
    const { data: membership } = await supabase
      .from("family_members")
      .select("role")
      .eq("family_id", book.family_id)
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get chapters in order
    const { data: chapters, error: chaptersError } = await supabase
      .from("chapters")
      .select("*")
      .in("id", book.chapter_ids || [])
      .order("order_index");

    if (chaptersError) {
      return NextResponse.json({ error: chaptersError.message }, { status: 500 });
    }

    // Get stories for each chapter
    const allStoryIds = chapters.flatMap(c => c.stories || []);
    const { data: stories, error: storiesError } = await supabase
      .from("stories")
      .select(`
        *,
        author:profiles!author_id(id, full_name),
        story_people(people:person_id(id, name, birth_date, death_date))
      `)
      .in("id", allStoryIds);

    if (storiesError) {
      return NextResponse.json({ error: storiesError.message }, { status: 500 });
    }

    // In production, this would generate actual PDF/DOCX
    // For now, we'll return a placeholder response
    // The actual generation would be done by a background job or serverless function

    // Update book status to compiling
    await supabase.from("books").update({ status: "compiling" }).eq("id", book_id);

    // Simulate async generation
    setTimeout(async () => {
      // This would be replaced with actual PDF/DOCX generation
      const generatedUrl = `/api/export/${format}/${book_id}/download`;

      await supabase.from("books").update({
        status: "ready",
        generated_url: generatedUrl,
      }).eq("id", book_id);

      // Log activity
      await supabase.from("activity_log").insert({
        family_id: book.family_id,
        user_id: user.id,
        action: "export",
        entity_type: "book",
        entity_id: book_id,
        description: `Exported book "${book.title}" as ${format.toUpperCase()}`,
      });
    }, 2000);

    return NextResponse.json({
      message: "Export started",
      book_id,
      format,
      estimated_time: "30 seconds",
    });
  } catch (error) {
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}