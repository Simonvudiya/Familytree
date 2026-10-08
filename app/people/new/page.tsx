import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { NewPersonClient } from "./NewPersonClient";

export const metadata: Metadata = {
  title: "Add Family Member | Our Family History",
  description: "Add a new person to your family tree",
};

export default async function NewPersonPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/people/new");
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

  return <NewPersonClient />;
}