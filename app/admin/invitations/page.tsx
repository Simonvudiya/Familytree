import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InvitationsClient } from "./InvitationsClient";

export const metadata: Metadata = {
  title: "Family Invitations | Our Family History",
};

export default async function InvitationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectTo=/admin/invitations");

  return <InvitationsClient />;
}