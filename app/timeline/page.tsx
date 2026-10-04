import { Metadata } from "next";
import { getServerSession } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TimelineClient } from "./TimelineClient";

export const metadata: Metadata = {
  title: "Family Timeline | Our Family History",
  description: "View your family's history chronologically",
};

export default async function TimelinePage() {
  const supabase = await getServerSession();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/timeline");
  }

  return <TimelineClient />;
}