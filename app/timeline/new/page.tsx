import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { NewTimelineEventClient } from "./NewTimelineEventClient";

export const metadata: Metadata = {
  title: "Add Timeline Event | Our Family History",
  description: "Create a new family timeline event",
};

export default async function NewTimelineEventPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/timeline/new");
  }

  const { data: membership } = await supabase
    .from("family_members")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (!membership) {
    redirect("/onboarding");
  }

  return <NewTimelineEventClient />;
}