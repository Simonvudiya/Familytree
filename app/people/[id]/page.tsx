import { Metadata } from "next";
import { getServerSession } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { PersonProfileClient } from "./PersonProfileClient";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = await getServerSession();
  const { id } = await params;
  const { data: person } = await supabase.from("people").select("name").eq("id", id).single();
  return {
    title: person?.name ? `${person.name} | Our Family History` : "Person Profile | Our Family History",
    description: person?.name ? `View the profile of ${person.name} in your family tree` : "View family member profile",
  };
}

export default async function PersonProfilePage({ params }: Props) {
  const supabase = await getServerSession();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/people/" + (await params).id);
  }

  const { id } = await params;
  const { data: person } = await supabase.from("people").select("*").eq("id", id).single();

  if (!person) {
    notFound();
  }

  return <PersonProfileClient person={person} />;
}