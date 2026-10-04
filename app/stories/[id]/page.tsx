import { Metadata } from "next";
import { getServerSession } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { StoryDetailClient } from "./StoryDetailClient";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = await getServerSession();
  const { id } = await params;
  const { data: story } = await supabase
    .from("stories")
    .select("title, excerpt")
    .eq("id", id)
    .single();
  
  return {
    title: story?.title ? `${story.title} | Our Family History` : "Story | Our Family History",
    description: story?.excerpt || "Read a family story",
  };
}

export default async function StoryDetailPage({ params }: Props) {
  const supabase = await getServerSession();
  const { data: { user } } = await supabase.auth.getUser();
  const { id } = await params;

  const { data: story, error } = await supabase
    .from("stories")
    .select(`
      *,
      author:profiles!author_id(id, full_name, avatar_url),
      story_people(people:person_id(id, name, birth_date, death_date, profile_image)),
      story_versions(id, title, created_at, created_by, change_summary)
    `)
    .eq("id", id)
    .single();

  if (error || !story) {
    notFound();
  }

  // Check visibility permissions
  if (story.visibility === "private" && story.author_id !== user?.id) {
    const { data: membership } = await supabase
      .from("family_members")
      .select("role")
      .eq("family_id", story.family_id)
      .eq("user_id", user?.id || "")
      .eq("status", "active")
      .in("role", ["owner", "admin", "editor"])
      .single();

    if (!membership) {
      notFound();
    }
  }

  if (story.visibility === "family") {
    const { data: membership } = await supabase
      .from("family_members")
      .select("id")
      .eq("family_id", story.family_id)
      .eq("user_id", user?.id || "")
      .eq("status", "active")
      .single();

    if (!membership && story.author_id !== user?.id) {
      redirect("/login?redirectTo=/stories/" + id);
    }
  }

  return <StoryDetailClient story={story} currentUserId={user?.id} />;
}