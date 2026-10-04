import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function WritePage() {
  async function createStory(formData: FormData) {
    "use server";

    const db = supabase();
    const { data: auth } = await db.auth.getUser();
    if (!auth.user) redirect("/login");

    const { data: profile } = await db
      .from("profiles")
      .select("id,family_id")
      .eq("id", auth.user.id)
      .single();

    if (!profile?.family_id) {
      throw new Error("Your account has not yet been connected to a family.");
    }

    const title = String(formData.get("title") || "").trim();
    const content = String(formData.get("content") || "").trim();
    const category = String(formData.get("category") || "").trim();
    const eventYearRaw = String(formData.get("event_year") || "").trim();
    const event_year = eventYearRaw ? Number(eventYearRaw) : null;

    if (!title || !content) throw new Error("Title and story are required.");

    const { data: story, error } = await db
      .from("stories")
      .insert({
        family_id: profile.family_id,
        author_id: auth.user.id,
        title,
        content,
        category,
        event_year,
        status: "published",
        published_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);

    await db.from("story_versions").insert({
      story_id: story.id,
      version_number: 1,
      title,
      content,
      edited_by: auth.user.id,
    });

    redirect("/stories");
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-4xl font-bold">Write My Story</h1>
      <p className="mt-2 text-stone-600">
        You can return later and add many separate memories. Each published entry
        records who wrote it and when.
      </p>

      <form action={createStory} className="mt-8 space-y-5">
        <label className="block">
          <span className="font-medium">Title</span>
          <input name="title" required className="mt-2 w-full rounded-xl border p-3" placeholder="My childhood in Ikobero" />
        </label>

        <label className="block">
          <span className="font-medium">Category</span>
          <select name="category" className="mt-2 w-full rounded-xl border p-3">
            <option>Childhood</option>
            <option>Education</option>
            <option>Work</option>
            <option>Marriage and family</option>
            <option>Faith and beliefs</option>
            <option>Community</option>
            <option>Colonial period</option>
            <option>Independence</option>
            <option>Technology and change</option>
            <option>Challenges and struggles</option>
            <option>Achievements</option>
            <option>Other</option>
          </select>
        </label>

        <label className="block">
          <span className="font-medium">Year or period</span>
          <input name="event_year" type="number" className="mt-2 w-full rounded-xl border p-3" placeholder="1962" />
        </label>

        <label className="block">
          <span className="font-medium">Your experience</span>
          <textarea name="content" required rows={16} className="mt-2 w-full rounded-xl border p-3" placeholder="Tell the family what happened, what you experienced, what you believed, what you learned..." />
        </label>

        <button className="rounded-xl bg-stone-900 px-6 py-3 font-medium text-white">
          Publish to family
        </button>
      </form>
    </main>
  );
}
