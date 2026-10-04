"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { StoryFormData, StoryStatus, StoryVisibility } from "@/types/story";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useFamily } from "@/hooks/useFamily";
import { Loader2, Save, Eye } from "lucide-react";

const STORY_CATEGORIES = [
  "Birth", "Childhood", "Family", "Education", "Work", "Marriage", "Faith", "Community",
  "Migration", "Colonial period", "Independence", "Politics and society", "Technology",
  "Agriculture", "Culture", "Challenges", "Achievements", "Traditions", "Important people",
  "Lessons", "Advice", "Other",
];

export function NewStoryClient() {
  const router = useRouter();
  const { family, role } = useFamily();
  const canPublish = role === "owner" || role === "admin" || role === "editor";
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(false);

  const [formData, setFormData] = useState<StoryFormData>({
    title: "",
    content: "",
    excerpt: "",
    event_date: "",
    event_year: undefined,
    category: "",
    location: "",
    status: "draft",
    visibility: "family",
    tags: [],
    people_ids: [],
  });

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

      const { data: story, error } = await supabase
        .from("stories")
        .insert({
          family_id: family.id,
          author_id: user.id,
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
          published_at: publish ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (error) throw error;

      if (formData.people_ids?.length) {
        await supabase.from("story_people").insert(
          formData.people_ids.map((person_id) => ({ story_id: story.id, person_id }))
        );
      }

      router.push(`/stories/${story.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create story");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof StoryFormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const wordCount = formData.content.split(/\s+/).filter(Boolean).length;
  const readingTime = Math.ceil(wordCount / 200);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-foreground">Write New Story</h1>
        <p className="text-muted-foreground mt-1">Share a memory, tale, or piece of family history</p>
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
              <Textarea
                value={formData.content}
                onChange={(e) => handleChange("content", e.target.value)}
                placeholder="Write your story here... Use Markdown for formatting."
                className="min-h-[300px] font-serif text-base leading-relaxed"
                required
              />
              <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
                <span>{wordCount} words · {readingTime} min read</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreview(!preview)}
                >
                  <Eye className="w-4 h-4 mr-1" aria-hidden="true" />
                  {preview ? "Edit" : "Preview"}
                </Button>
              </div>
            </div>

            {preview && (
              <div className="prose max-w-none p-4 bg-muted rounded-lg border border-border">
                <div dangerouslySetInnerHTML={{ __html: formData.content }} />
              </div>
            )}

            <Input
              label="Excerpt (optional)"
              value={formData.excerpt}
              onChange={(e) => handleChange("excerpt", e.target.value)}
              placeholder="A brief summary for previews..."
              maxLength={300}
            />

            <div className="border-t border-border pt-4">
              <h3 className="font-medium text-foreground">When and where it happened</h3>
              <p className="mb-3 mt-1 text-sm text-muted-foreground">These describe the event, not the date you are writing this story.</p>
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
                  value={formData.category || ""}
                  onChange={(e) => handleChange("category", e.target.value)}
                  options={[{ value: "", label: "Choose a category..." }, ...STORY_CATEGORIES.map((category) => ({ value: category, label: category }))]}
                />
                <Input
                  label="Location (optional)"
                  value={formData.location || ""}
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
                  ...(canPublish ? [{ value: "published", label: "Published" }] : []),
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

            <Input
              label="Tags (comma-separated)"
              value={formData.tags.join(", ")}
              onChange={(e) => handleChange("tags", e.target.value.split(",").map(t => t.trim()).filter(Boolean))}
              placeholder="family, history, childhood, kenya"
            />
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
            <PeopleSelector
              familyId={family?.id}
              selectedIds={formData.people_ids || []}
              onChange={(ids) => handleChange("people_ids", ids)}
            />
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving || !formData.title || !formData.content}
          >
            <Save className="w-4 h-4 mr-2" aria-hidden="true" />
            {saving ? "Saving..." : "Save Draft"}
          </Button>
          {canPublish && (
            <Button
              type="button"
              variant="secondary"
              onClick={(e) => { e.preventDefault(); handleSubmit(e, true); }}
              disabled={saving || !formData.title || !formData.content}
            >
              Publish
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

function PeopleSelector({ familyId, selectedIds, onChange }: { familyId?: string; selectedIds: string[]; onChange: (ids: string[]) => void }) {
  const [people, setPeople] = useState<{ id: string; name: string; birth_date?: string; death_date?: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!familyId) return;
    const fetchPeople = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("people")
        .select("id, name, birth_date, death_date")
        .eq("family_id", familyId)
        .order("name");
      setPeople(data || []);
      setLoading(false);
    };
    fetchPeople();
  }, [familyId]);

  const togglePerson = (id: string) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter((i) => i !== id) : [...selectedIds, id]);
  };

  if (loading) return <div className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />Loading...</div>;

  return (
    <div className="flex flex-wrap gap-2">
      {people.map((person) => (
        <button
          key={person.id}
          type="button"
          onClick={() => togglePerson(person.id)}
          className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
            selectedIds.includes(person.id)
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
  );
}

import { useEffect } from "react";