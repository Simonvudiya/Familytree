import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/supabase/server";
import { SettingsClient } from "./SettingsClient";

export const metadata: Metadata = {
  title: "Settings | Our Family History",
};

export default async function SettingsPage() {
  const supabase = await getServerSession();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectTo=/settings");

  return <SettingsClient />;
}