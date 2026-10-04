"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StoryEditor } from "@/components/stories/StoryEditor";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";
import { Story, StoryStatus, StoryVisibility } from "@/types/story";
import { useFamily } from "@/hooks/useFamily";
import { Loader2, Save, Eye, ArrowLeft, Clock, Tag } from "lucide-react";

const STORY_CATEGORIES = [
  "Birth", "Childhood", "Family", "Education", "Work", "Marriage", "Faith", "Community",
  "Migration", "Colonial period", "Independence", "Politics and society", "Technology",
  "Agriculture", "Culture", "Challenges", "Achievements", "Traditions", "Important people",
  "Lessons", "Advice", "Other",
];

interface EditStoryClientProps {
  story: Story & {
    story_people: { person_id: string }[];
  };
}

export function EditStoryClient({ story }: EditStoryClientProps) {
  const router = useRouter();
  const { family, role } = useFamily();
  const canPublish = role === "owner" || role === "admin" || role === "editor";
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState("");
  const [people, setPeople] = useState<{ id: string; name: string; birth_date?: string; death_date?: string }[]>([]);

  const [formData, setFormData] = useState({
    title: story.title,
    content: story.content,
    excerpt: story.excerpt || "",
    event_date: story.event_date || "",
    event_year: story.event_year ?? undefined,
    category: story.category || "",
    location: story.location || "",
    status: story.status,
    visibility: story.visibility,
    tags: story.tags,
    people_ids: story.story_people?.map(p => p.person_id) || [],
  });

  useEffect(() => {
    if (!family) return;
    const fetchPeople = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("people")
        .select("id, name, birth_date, death_date")
        .eq("family_id", family.id)
        .order("name");
      setPeople(data || []);
    };
    fetchPeople();
  }, [family]);

  const handleSubmit = async (e: React.FormEvent, publish = false) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error("Not authenticated");
      if (!family) throw new Error("No family selected");

      const wordCount = formData.content.split(/\s+/).filter(Boolean).length;
      const readingTime = Math.ceil(wordCount / 200);
      const slug = formData.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

      const { error } = await supabase
        .from("stories")
        .update({
          title: formData.title,
          slug,
          content: formData.content,
          excerpt: formData.excerpt,
          event_date: formData.event_date || null,
          event_year: formData.event_year || null,
          category: formData.category || null,
          location: formData.location || null,
          status: publish ? "published" : formData.status,
          visibility: formData.visibility,
          tags: formData.tags,
          word_count: wordCount,
          reading_time: readingTime,
          published_at: publish ? new Date().toISOString() : story.published_at,
          updated_at: new Date().toISOString(),
        })
        .eq("id", story.id);

      if (error) throw error;

      // Update people associations
      await supabase.from("story_people").delete().eq("story_id", story.id);
      if (formData.people_ids?.length) {
        await supabase.from("story_people").insert(
          formData.people_ids.map((person_id: string) => ({ story_id: story.id, person_id }))
        );
      }

      router.push(`/stories/${story.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update story");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const wordCount = formData.content.split(/\s+/).filter(Boolean).length;
  const readingTime = Math.ceil(wordCount / 200);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6 flex items-center gap-4">
        <Link href={`/stories/${story.id}`}>
          <Button variant="ghost" size="icon" aria-label="Back to story">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Edit Story</h1>
          <p className="text-muted-foreground">Update your family story</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Story Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Title"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="Enter a compelling title..."
              required
              error={formData.title ? undefined : "Title is required"}
            />

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Content</label>
              <StoryEditor
                value={formData.content}
                onChange={(content) => handleChange("content", content)}
                placeholder="Write your story here... Use Markdown for formatting."
              />
              <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
                <span>{wordCount} words · {readingTime} min read</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreview(!preview)}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  {preview ? "Edit" : "Preview"}
                </Button>
              </div>
            </div>

            {preview && (
              <div className="prose max-w-none p-4 bg-muted rounded-lg border border-border">
                <div dangerouslySetInnerHTML={{ __html: formData.content }} />
              </div>
            )}

            <Textarea
              label="Excerpt (optional)"
              value={formData.excerpt}
              onChange={(e) => handleChange("excerpt", e.target.value)}
              placeholder="A brief summary for previews..."
              maxLength={300}
            />

            <div className="border-t border-border pt-4">
              <h3 className="font-medium text-foreground">When and where it happened</h3>
              <p className="mb-3 mt-1 text-sm text-muted-foreground">These describe the event, not the date you are editing this story.</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Historical year"
                  type="number"
                  min={1}
                  max={new Date().getFullYear()}
                  value={formData.event_year ?? ""}
                  onChange={(e) => handleChange("event_year", e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="For example, 1962"
                />
                <Input
                  label="Historical date (optional)"
                  type="date"
                  value={formData.event_date}
                  onChange={(e) => handleChange("event_date", e.target.value)}
                  max={new Date().toISOString().slice(0, 10)}
                />
                <Select
                  label="Category"
                  value={formData.category}
                  onChange={(e) => handleChange("category", e.target.value)}
                  options={[{ value: "", label: "Choose a category..." }, ...STORY_CATEGORIES.map((category) => ({ value: category, label: category }))]}
                />
                <Input
                  label="Location (optional)"
                  value={formData.location}
                  onChange={(e) => handleChange("location", e.target.value)}
                  placeholder="Village, town, or place"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Status"
                value={formData.status}
                onChange={(e) => handleChange("status", e.target.value as StoryStatus)}
                options={[
                  { value: "draft", label: "Draft" },
                  { value: "review", label: "In Review" },
                  ...((canPublish || story.status === "published") ? [{ value: "published", label: "Published" }] : []),
                  { value: "archived", label: "Archived" },
                ]}
              />
              <Select
                label="Visibility"
                value={formData.visibility}
                onChange={(e) => handleChange("visibility", e.target.value as StoryVisibility)}
                options={[
                  { value: "private", label: "Private (Only me)" },
                  { value: "family", label: "Family Members" },
                  { value: "public", label: "Public" },
                ]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Tags</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map((tag, index) => (
                  <span key={index} className="px-2 py-1 text-sm bg-primary-100 text-primary-700 rounded-full flex items-center gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleChange("tags", formData.tags.filter((_, i) => i !== index))}
                      className="hover:text-primary-900"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <Input
                placeholder="Add tag (press Enter)"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.currentTarget.value.trim()) {
                    e.preventDefault();
                    handleChange("tags", [...formData.tags, e.currentTarget.value.trim()]);
                    e.currentTarget.value = "";
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>People Mentioned</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Link family members mentioned in this story (optional)
            </p>
            <div className="flex flex-wrap gap-2">
              {people.map((person) => (
                <button
                  key={person.id}
                  type="button"
                  onClick={() => handleChange(
                    "people_ids",
                    formData.people_ids.includes(person.id)
                      ? formData.people_ids.filter((id: string) => id !== person.id)
                      : [...formData.people_ids, person.id]
                  )}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    formData.people_ids.includes(person.id)
                      ? "bg-primary-600 text-white border-primary-600"
                      : "bg-background text-foreground border-border hover:bg-muted"
                  }`}
                >
                  {person.name}
                  {person.birth_date && (
                    <span className="ml-1 text-xs opacity-75">
                      ({new Date(person.birth_date).getFullYear()}{person.death_date ? `–${new Date(person.death_date!).getFullYear()}` : "–Present"})
                    </span>
                  )}
                </button>
              ))}
              {people.length === 0 && (
                <span className="text-sm text-muted-foreground">No family members added yet</span>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4 justify-end">
          <Link href={`/stories/${story.id}`}>
            <Button type="button" variant="outline" disabled={saving}>
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={saving || !formData.title || !formData.content}>
            <Save className="w-4 h-4 mr-2" aria-hidden="true" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
          {canPublish && (
            <Button
              type="button"
              variant="secondary"
              onClick={(e) => { e.preventDefault(); handleSubmit(e, true); }}
              disabled={saving || !formData.title || !formData.content}
            >
              {story.status === "published" ? "Republish" : "Publish"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
