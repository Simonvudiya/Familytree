import { Metadata } from "next";
import { getServerSession } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TreeClient } from "./TreeClient";

export const metadata: Metadata = {
  title: "Family Tree | Our Family History",
  description: "Visualize your family tree",
};

export default async function TreePage() {
  const supabase = await getServerSession();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/tree");
  }

  return <TreeClient />;
}