import { Metadata } from "next";
import { getServerSession } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { AutobiographySessionClient } from "./AutobiographySessionClient";

interface Props {
  params: Promise<{ personId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = await getServerSession();
  const { personId: sessionId } = await params;
  const { data: session } = await supabase
    .from("autobiography_sessions")
    .select("person_id")
    .eq("id", sessionId)
    .single();
  const { data: person } = session ? await supabase
    .from("people")
    .select("name")
    .eq("id", session.person_id)
    .single() : { data: null };
  
  return {
    title: person?.name ? `Autobiography: ${person.name} | Our Family History` : "Autobiography | Our Family History",
  };
}

export default async function AutobiographyPersonPage({ params }: Props) {
  const supabase = await getServerSession();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/autobiography/" + (await params).personId);
  }

  const { personId: sessionId } = await params;
  const { data: session } = await supabase
    .from("autobiography_sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (!session) {
    notFound();
  }

  const { data: person } = await supabase
    .from("people")
    .select("*")
    .eq("id", session.person_id)
    .single();

  if (!person) {
    notFound();
  }

  return <AutobiographySessionClient session={session} person={person} />;
}