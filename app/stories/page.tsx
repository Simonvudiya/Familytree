import { Metadata } from "next";
import { getServerSession } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { StoriesClient } from "./StoriesClient";

export const metadata: Metadata = {
  title: "Family Stories | Our Family History",
  description: "Browse and discover your family's stories",
};

export default async function StoriesPage() {
  const supabase = await getServerSession();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/stories");
  }

  return <StoriesClient />;
}