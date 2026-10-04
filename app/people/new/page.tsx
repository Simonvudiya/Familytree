import { Metadata } from "next";
import { getServerSession } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { NewPersonClient } from "./NewPersonClient";

export const metadata: Metadata = {
  title: "Add Family Member | Our Family History",
  description: "Add a new person to your family tree",
};

export default async function NewPersonPage() {
  const supabase = await getServerSession();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/people/new");
  }

  return <NewPersonClient />;
}