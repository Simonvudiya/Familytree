import { Metadata } from "next";
import { getServerSession } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { EditStoryClient } from "./EditStoryClient";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = await getServerSession();
  const { id } = await params;
  const { data: story } = await supabase
    .from("stories")
    .select("title")
    .eq("id", id)
    .single();
  
  return {
    title: story?.title ? `Edit: ${story.title} | Our Family History` : "Edit Story | Our Family History",
  };
}

export default async function EditStoryPage({ params }: Props) {
  const supabase = await getServerSession();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/stories/" + (await params).id + "/edit");
  }

  const { id } = await params;
  const { data: story, error } = await supabase
    .from("stories")
    .select(`
      *,
      story_people(person_id)
    `)
    .eq("id", id)
    .single();

  if (error || !story) {
    notFound();
  }

  // Check permissions
  const { data: membership } = await supabase
    .from("family_members")
    .select("role")
    .eq("family_id", story.family_id)
    .eq("user_id", user.id)
    .eq("status", "active")
    .single();

  const canEdit = story.author_id === user.id || 
    membership?.role && ["owner", "admin", "editor"].includes(membership.role);

  if (!canEdit) {
    notFound();
  }

  return <EditStoryClient story={story} />;
}