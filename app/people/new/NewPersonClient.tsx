"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PersonFormData } from "@/types/person";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useFamily } from "@/hooks/useFamily";
import { Loader2, Save, User, UserPlus, Image } from "lucide-react";

export function NewPersonClient() {
  const router = useRouter();
  const { family, loading: familyLoading } = useFamily();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const [formData, setFormData] = useState<PersonFormData>({
    name: "",
    sex: undefined,
    birth_date: "",
    birth_place: "",
    death_date: "",
    death_place: "",
    bio: "",
    is_living: true,
    parent_ids: [],
    spouse_ids: [],
  });

  const [availablePeople, setAvailablePeople] = useState<{ id: string; name: string; birth_date?: string; death_date?: string }[]>([]);

  useEffect(() => {
    if (!family) return;
    const fetchPeople = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("people")
        .select("id, name, birth_date, death_date")
        .eq("family_id", family.id)
        .order("name");
      setAvailablePeople(data || []);
    };
    fetchPeople();
  }, [family]);

  // Show loading while family is being fetched
  if (familyLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" aria-hidden="true" />
        </div>
      </div>
    );
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    console.log("[NewPersonClient] Uploading image:", file.name, file.type);
    setUploadingImage(true);
    try {
      const supabase = createClient();
      const fileName = `${crypto.randomUUID()}.${file.name.split(".").pop()}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("family-media")
        .upload(`${family?.id}/${fileName}`, file);

      if (uploadError) {
        console.error("[NewPersonClient] Image upload error:", uploadError);
        throw uploadError;
      }

      const { data: urlData } = supabase.storage.from("family-media").getPublicUrl(uploadData.path);
      console.log("[NewPersonClient] Image uploaded:", urlData.publicUrl);
      setImagePreview(urlData.publicUrl);
      setFormData((prev) => ({ ...prev, profile_image: urlData.publicUrl }));
    } catch (err) {
      console.error("[NewPersonClient] Image upload failed:", err);
      setError(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[NewPersonClient] handleSubmit called, formData:", formData);
    setError("");
    setSaving(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      console.log("[NewPersonClient] user:", user?.id);

      if (!user) throw new Error("Not authenticated");
      if (!family) {
        console.warn("[NewPersonClient] No family, redirecting to onboarding");
        router.push("/onboarding");
        return;
      }

      const slug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      console.log("[NewPersonClient] slug:", slug);

      const { data: person, error } = await supabase
        .from("people")
        .insert({
          family_id: family.id,
          created_by: user.id,
          name: formData.name,
          slug,
          sex: formData.sex,
          birth_date: formData.birth_date || null,
          birth_place: formData.birth_place || null,
          death_date: formData.death_date || null,
          death_place: formData.death_place || null,
          bio: formData.bio || null,
          profile_image: formData.profile_image as string || null,
          is_living: formData.is_living,
        })
        .select()
        .single();

      if (error) {
        console.error("[NewPersonClient] Insert error:", error);
        throw error;
      }

      console.log("[NewPersonClient] Person created:", person);

      if (formData.parent_ids?.length) {
        console.log("[NewPersonClient] Adding parent relationships:", formData.parent_ids);
        await supabase.from("relationships").insert(
          formData.parent_ids.map((parent_id) => ({
            family_id: family.id,
            person_id: parent_id,
            related_person_id: person.id,
            type: "parent",
          }))
        );
      }

      if (formData.spouse_ids?.length) {
        console.log("[NewPersonClient] Adding spouse relationships:", formData.spouse_ids);
        await supabase.from("relationships").insert(
          formData.spouse_ids.map((spouse_id) => ({
            family_id: family.id,
            person_id: person.id,
            related_person_id: spouse_id,
            type: "spouse",
          }))
        );
      }

      router.push(`/people/${person.id}`);
      router.refresh();
    } catch (err) {
      console.error("[NewPersonClient] Unexpected error:", err);
      setError(err instanceof Error ? err.message : "Failed to create person");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof PersonFormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleArrayField = (field: "parent_ids" | "spouse_ids", id: string) => {
    setFormData((prev) => {
      const current = prev[field] || [];
      return {
        ...prev,
        [field]: current.includes(id) ? current.filter((i) => i !== id) : [...current, id],
      };
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-foreground">Add Family Member</h1>
        <p className="text-muted-foreground mt-1">Add a new person to your family tree</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Basic Information</CardTitle>
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="sr-only"
                  disabled={uploadingImage}
                />
                <Button type="button" variant="outline" size="sm" disabled={uploadingImage} onClick={triggerFileInput}>
                  <Image className="w-4 h-4 mr-2" aria-hidden="true" />
                  {uploadingImage ? "Uploading..." : imagePreview ? "Change Photo" : "Add Photo"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {imagePreview && (
              <div className="relative w-24 h-24 mx-auto mb-4">
                <img src={imagePreview} alt="Profile preview" className="w-full h-full rounded-full object-cover border-4 border-border" />
              </div>
            )}

            <Input
              label="Full Name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Enter full name"
              required
              error={formData.name ? undefined : "Name is required"}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Sex"
                value={formData.sex || ""}
                onChange={(e) => handleChange("sex", e.target.value as "male" | "female" | "other" | undefined)}
                options={[
                  { value: "", label: "Select..." },
                  { value: "male", label: "Male" },
                  { value: "female", label: "Female" },
                  { value: "other", label: "Other" },
                ]}
              />
              <Select
                label="Status"
                value={formData.is_living ? "living" : "deceased"}
                onChange={(e) => handleChange("is_living", e.target.value === "living")}
                options={[
                  { value: "living", label: "Living" },
                  { value: "deceased", label: "Deceased" },
                ]}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Birth Date"
                type="date"
                value={formData.birth_date}
                onChange={(e) => handleChange("birth_date", e.target.value)}
                max={new Date().toISOString().split("T")[0]}
              />
              <Input
                label="Birth Place"
                value={formData.birth_place}
                onChange={(e) => handleChange("birth_place", e.target.value)}
                placeholder="City, Country"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ display: formData.is_living ? "none" : "grid" }}>
              <Input
                label="Death Date"
                type="date"
                value={formData.death_date}
                onChange={(e) => handleChange("death_date", e.target.value)}
                max={new Date().toISOString().split("T")[0]}
              />
              <Input
                label="Death Place"
                value={formData.death_place}
                onChange={(e) => handleChange("death_place", e.target.value)}
                placeholder="City, Country"
              />
            </div>

            <Textarea
              label="Biography"
              value={formData.bio}
              onChange={(e) => handleChange("bio", e.target.value)}
              placeholder="Write a brief biography..."
              rows={4}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Relationships</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Parents</label>
              <div className="flex flex-wrap gap-2">
                {availablePeople.map((person) => (
                  <button
                    key={person.id}
                    type="button"
                    onClick={() => toggleArrayField("parent_ids", person.id)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                      formData.parent_ids?.includes(person.id)
                        ? "bg-primary-600 text-white border-primary-600"
                        : "bg-background text-foreground border-border hover:bg-muted"
                    }`}
                  >
                    {person.name}
                    <span className="ml-1 text-xs opacity-75">
                      ({new Date(person.birth_date!).getFullYear()}{person.death_date ? `–${new Date(person.death_date!).getFullYear()}` : "–Present"})
                    </span>
                  </button>
                ))}
                {availablePeople.length === 0 && (
                  <span className="text-sm text-muted-foreground">No other family members yet</span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Spouses / Partners</label>
              <div className="flex flex-wrap gap-2">
                {availablePeople.filter(p => !formData.parent_ids?.includes(p.id)).map((person) => (
                  <button
                    key={person.id}
                    type="button"
                    onClick={() => toggleArrayField("spouse_ids", person.id)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                      formData.spouse_ids?.includes(person.id)
                        ? "bg-primary-600 text-white border-primary-600"
                        : "bg-background text-foreground border-border hover:bg-muted"
                    }`}
                  >
                    {person.name}
                    <span className="ml-1 text-xs opacity-75">
                      ({new Date(person.birth_date!).getFullYear()}{person.death_date ? `–${new Date(person.death_date!).getFullYear()}` : "–Present"})
                    </span>
                  </button>
                ))}
              </div>
            </div>
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
          <Button type="submit" disabled={saving || !formData.name}>
            <Save className="w-4 h-4 mr-2" aria-hidden="true" />
            {saving ? "Saving..." : "Add Family Member"}
          </Button>
        </div>
      </form>
    </div>
  );
}