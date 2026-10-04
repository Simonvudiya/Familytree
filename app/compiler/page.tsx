import { Metadata } from "next";
import { getServerSession } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CompilerClient } from "./CompilerClient";

export const metadata: Metadata = {
  title: "Book Compiler | Our Family History",
  description: "Compile your family history into a beautiful book",
};

export default async function CompilerPage() {
  const supabase = await getServerSession();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/compiler");
  }

  return <CompilerClient />;
}