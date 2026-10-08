"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { TimelineEventFormData, EventType } from "@/types/timeline";
import { Person } from "@/types/person";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useFamily } from "@/hooks/useFamily";
import { Loader2, Save, X, Calendar, MapPin, Tag, Users } from "lucide-react";

const EVENT_TYPES: { value: EventType; label: string; icon: string }[] = [
  { value: "birth", label: "Birth", icon: "👶" },
  { value: "death", label: "Death", icon: "⚰️" },
  { value: "marriage", label: "Marriage", icon: "💒" },
  { value: "divorce", label: "Divorce", icon: "💔" },
  { value: "graduation", label: "Graduation", icon: "🎓" },
  { value: "career", label: "Career", icon: "💼" },
  { value: "military", label: "Military", icon: "🎖️" },
  { value: "migration", label: "Migration", icon: "🌍" },
  { value: "achievement", label: "Achievement", icon: "🏆" },
  { value: "historical", label: "Historical", icon: "📜" },
  { value: "custom", label: "Custom", icon: "📌" },
];

const SIGNIFICANCE_OPTIONS = [
  { value: "personal", label: "Personal" },
  { value: "family", label: "Family" },
  { value: "historical", label: "Historical" },
  { value: "milestone", label: "Milestone" },
];

export function NewTimelineEventClient() {
  const router = useRouter();
  const { family } = useFamily();
  const [people, setPeople] = useState<Person[]>([]);
  const [peopleLoading, setPeopleLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [selectedPeople, setSelectedPeople] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const [formData, setFormData] = useState<TimelineEventFormData>({
    title: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    end_date: "",
    location: "",
    event_type: "custom",
    significance: "personal",
    tags: [],
    people_ids: [],
    media_files: [],
  });

  useEffect(() => {
    if (!family) return;
    setPeopleLoading(true);
    const supabase = createClient();
    supabase
      .from("people")
      .select("id, family_id, created_by, name, slug, sex, birth_date, birth_place, death_date, death_place, bio, profile_image, is_living, generation, created_at, updated_at")
      .eq("family_id", family.id)
      .order("name")
      .then(({ data, error }) => {
        if (!error) setPeople(data || []);
        setPeopleLoading(false);
      });
  }, [family]);

  useEffect(() => {
    if (peopleLoading) return;
    setLoading(false);
  }, [peopleLoading]);

  const handleChange = (field: keyof TimelineEventFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleTagAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) {
      setTags((prev) => [...prev, tag]);
      setTagInput("");
    }
  };

  const handleTagRemove = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const handlePersonToggle = (personId: string) => {
    setSelectedPeople((prev) =>
      prev.includes(personId)
        ? prev.filter((id) => id !== personId)
        : [...prev, personId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error("Not authenticated");
      if (!family) {
        router.push("/onboarding");
        return;
      }

      formData.tags = tags;
      formData.people_ids = selectedPeople;

      const { data: event, error: insertError } = await supabase
        .from("timeline_events")
        .insert({
          family_id: family.id,
          created_by: user.id,
          title: formData.title,
          description: formData.description,
          date: formData.date,
          end_date: formData.end_date || null,
          location: formData.location || null,
          event_type: formData.event_type,
          significance: formData.significance,
          tags: formData.tags,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      if (selectedPeople.length > 0) {
        const peopleLinks = selectedPeople.map((personId) => ({
          event_id: event.id,
          person_id: personId,
        }));
        const { error: peopleError } = await supabase
          .from("timeline_event_people")
          .insert(peopleLinks);
        if (peopleError) throw peopleError;
      }

      router.push("/timeline");
      router.refresh();
    } catch (err: any) {
      console.error("[NewTimelineEventClient] Insert error:", err);
      setError(err.message || "Failed to create event");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-3xl mx-auto">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 animate-pulse">
              <div className="w-12 h-12 rounded-lg bg-muted" />
              <div className="flex-1">
                <div className="h-5 bg-muted rounded w-3/4 mb-2" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Add Timeline Event</h1>
            <p className="text-muted-foreground mt-1">Record a significant moment in your family's history</p>
          </div>
          <Button variant="ghost" onClick={() => router.back()}>
            <X className="w-4 h-4 mr-2" aria-hidden="true" />
            Cancel
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm" role="alert">
              {error}
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Input
                    label="Title *"
                    value={formData.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                    placeholder="e.g., Grandparents' Wedding"
                    required
                    error={!formData.title ? "Title is required" : undefined}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5 flex items-center gap-2">
                    <span className="text-lg">🏷️</span>
                    Event Type *
                  </label>
                  <Select
                    value={formData.event_type}
                    onChange={(e) => handleChange("event_type", e.target.value as EventType)}
                    options={EVENT_TYPES.map((t) => ({ value: t.value, label: `${t.icon} ${t.label}` }))}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Significance</label>
                  <Select
                    value={formData.significance}
                    onChange={(e) => handleChange("significance", e.target.value as "personal" | "family" | "historical" | "milestone")}
                    options={SIGNIFICANCE_OPTIONS.map((s) => ({ value: s.value, label: s.label }))}
                  />
                </div>

                <div>
                  <Input
                    label="Date *"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleChange("date", e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Input
                    label="End Date (optional)"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => handleChange("end_date", e.target.value)}
                  />
                </div>

                <div className="sm:col-span-2">
                  <Input
                    label="Location"
                    value={formData.location}
                    onChange={(e) => handleChange("location", e.target.value)}
                    placeholder="City, Country"
                  />
                </div>
              </div>

              <div>
                <Textarea
                  label="Description"
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Add details about this event..."
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5 flex items-center gap-2">
                  <Tag className="w-4 h-4" aria-hidden="true" />
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleTagRemove(tag)}
                        className="hover:text-primary-900"
                        aria-label={`Remove tag ${tag}`}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
                <form onSubmit={handleTagAdd} className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add a tag (press Enter)"
                    className="flex-1"
                  />
                  <Button type="submit" variant="outline" size="sm">Add</Button>
                </form>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5 flex items-center gap-2">
                  <Users className="w-4 h-4" aria-hidden="true" />
                  People Involved
                </label>
                <div className="flex flex-wrap gap-2">
                  {people.map((person) => (
                    <button
                      key={person.id}
                      type="button"
                      onClick={() => handlePersonToggle(person.id)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                        selectedPeople.includes(person.id)
                          ? "bg-primary-600 text-white border-primary-600"
                          : "bg-muted text-foreground border-border hover:bg-muted/80"
                      }`}
                    >
                      {person.name}
                    </button>
                  ))}
                </div>
                {!people.length && (
                  <p className="text-sm text-muted-foreground">No family members available. Add people first.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !formData.title}>
              <Save className="w-4 h-4 mr-2" aria-hidden="true" />
              {saving ? "Saving..." : "Save Event"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}