import { Metadata } from "next";
import { getServerSession } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AutobiographyClient } from "./AutobiographyClient";

export const metadata: Metadata = {
  title: "Guided Autobiography | Our Family History",
  description: "Help your loved ones write their life story",
};

export default async function AutobiographyPage() {
  const supabase = await getServerSession();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/autobiography");
  }

  return <AutobiographyClient />;
}