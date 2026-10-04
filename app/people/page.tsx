import { Metadata } from "next";
import { getServerSession } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PeopleClient } from "./PeopleClient";

export const metadata: Metadata = {
  title: "Family Members | Our Family History",
  description: "Browse and manage your family members",
};

export default async function PeoplePage() {
  const supabase = await getServerSession();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/people");
  }

  return <PeopleClient />;
}