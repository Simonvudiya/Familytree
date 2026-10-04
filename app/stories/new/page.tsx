import { Metadata } from "next";
import { getServerSession } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { NewStoryClient } from "./NewStoryClient";

export const metadata: Metadata = {
  title: "Write New Story | Our Family History",
  description: "Create a new family story",
};

export default async function NewStoryPage() {
  const supabase = await getServerSession();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/stories/new");
  }

  return <NewStoryClient />;
}