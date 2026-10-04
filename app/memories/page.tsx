import { Metadata } from "next";
import { getServerSession } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MemoriesClient } from "./MemoriesClient";

export const metadata: Metadata = {
  title: "Memories & Testimonies | Our Family History",
  description: "Collect and preserve family memories, quotes, recipes, and traditions",
};

export default async function MemoriesPage() {
  const supabase = await getServerSession();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/memories");
  }

  return <MemoriesClient />;
}