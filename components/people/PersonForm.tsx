"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { PersonFormData } from "@/types/person";
import { User, Calendar, MapPin, Heart, Loader2, Save, Image, X } from "lucide-react";

interface PersonFormProps {
  initialData?: Partial<PersonFormData>;
  onSubmit: (data: PersonFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  availablePeople?: { id: string; name: string; birth_date?: string; death_date?: string }[];
}

export function PersonForm({
  initialData = {},
  onSubmit,
  onCancel,
  isLoading = false,
  availablePeople = [],
}: PersonFormProps) {
  const [formData, setFormData] = useState<PersonFormData>({
    name: "",
    sex: undefined,
    birth_date: "",
    birth_place: "",
    death_date: "",
    death_place: "",
    bio: "",
    is_living: true,
    profile_image: undefined,
    parent_ids: [],
    spouse_ids: [],
    ...initialData,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof PersonFormData, string>>>({});

  const validateField = (name: keyof PersonFormData, value: unknown) => {
    switch (name) {
      case "name":
        if (!value || (value as string).trim().length < 2) {
          return "Name must be at least 2 characters";
        }
        break;
      case "birth_date":
        if (value && new Date(value as string) > new Date()) {
          return "Birth date cannot be in the future";
        }
        break;
      case "death_date":
        if (value && formData.birth_date && new Date(value as string) < new Date(formData.birth_date)) {
          return "Death date must be after birth date";
        }
        if (value && new Date(value as string) > new Date()) {
          return "Death date cannot be in the future";
        }
        break;
    }
    return "";
  };

  const handleChange = (name: keyof PersonFormData, value: unknown) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleBlur = (name: keyof PersonFormData) => {
    const error = validateField(name, formData[name]);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrors(prev => ({ ...prev, profile_image: "Please select an image file" }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, profile_image: "Image must be less than 5MB" }));
      return;
    }

    setUploadingImage(true);
    try {
      // In production, upload to Supabase Storage
      // For now, create object URL
      const url = URL.createObjectURL(file);
      setImagePreview(url);
      setFormData(prev => ({ ...prev, profile_image: url }));
      setErrors(prev => ({ ...prev, profile_image: "" }));
    } catch (error) {
      setErrors(prev => ({ ...prev, profile_image: "Failed to upload image" }));
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setFormData(prev => ({ ...prev, profile_image: undefined }));
  };

  const toggleArrayField = (field: "parent_ids" | "spouse_ids", id: string) => {
    setFormData(prev => {
      const current = prev[field] || [];
      return {
        ...prev,
        [field]: current.includes(id) ? current.filter(i => i !== id) : [...current, id],
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const newErrors: Partial<Record<keyof PersonFormData, string>> = {};
    (Object.keys(formData) as Array<keyof PersonFormData>).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    await onSubmit(formData);
  };

  const isLiving = formData.is_living;

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* Profile Photo */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Profile Photo</label>
        <div className="flex items-center gap-4">
          <div className="relative w-24 h-24 rounded-full bg-primary-100 overflow-hidden flex-shrink-0">
            {imagePreview ? (
              <img src={imagePreview} alt="Profile preview" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-primary-600 font-display font-bold text-2xl">
                {formData.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?"}
              </div>
            )}
            {imagePreview && (
              <button
                type="button"
                onClick={removeImage}
                className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-destructive text-white flex items-center justify-center text-xs hover:bg-destructive/90"
                aria-label="Remove photo"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="sr-only"
                disabled={uploadingImage || isLoading}
              />
              <Button type="button" variant="outline" disabled={uploadingImage || isLoading}>
                <Image className="w-4 h-4 mr-2" />
                {uploadingImage ? "Uploading..." : imagePreview ? "Change Photo" : "Add Photo"}
              </Button>
            </label>
            {errors.profile_image && (
              <p className="text-sm text-destructive">{errors.profile_image}</p>
            )}
          </div>
        </div>
      </div>

      {/* Basic Information */}
      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label="Full Name"
          value={formData.name}
          onChange={e => handleChange("name", e.target.value)}
          onBlur={() => handleBlur("name")}
          placeholder="Enter full name"
          error={errors.name}
          required
        />

        <Select
          label="Sex"
          value={formData.sex || ""}
          onChange={e => handleChange("sex", e.target.value as "male" | "female" | "other" | undefined)}
          options={[
            { value: "", label: "Select..." },
            { value: "male", label: "Male" },
            { value: "female", label: "Female" },
            { value: "other", label: "Other" },
          ]}
          error={errors.sex}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label="Birth Date"
          type="date"
          value={formData.birth_date}
          onChange={e => handleChange("birth_date", e.target.value)}
          onBlur={() => handleBlur("birth_date")}
          max={new Date().toISOString().split("T")[0]}
          error={errors.birth_date}
        />

        <Input
          label="Birth Place"
          value={formData.birth_place}
          onChange={e => handleChange("birth_place", e.target.value)}
          placeholder="City, Country"
          onBlur={() => handleBlur("birth_place")}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2" style={{ display: isLiving ? "none" : "grid" }}>
        <Input
          label="Death Date"
          type="date"
          value={formData.death_date}
          onChange={e => handleChange("death_date", e.target.value)}
          onBlur={() => handleBlur("death_date")}
          max={new Date().toISOString().split("T")[0]}
          error={errors.death_date}
        />

        <Input
          label="Death Place"
          value={formData.death_place}
          onChange={e => handleChange("death_place", e.target.value)}
          placeholder="City, Country"
          onBlur={() => handleBlur("death_place")}
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="is_living"
          checked={formData.is_living}
          onChange={e => handleChange("is_living", e.target.checked)}
          className="w-4 h-4 rounded border-input text-primary-600 focus:ring-primary-500"
        />
        <label htmlFor="is_living" className="text-sm font-medium text-foreground">
          Currently living
        </label>
      </div>

      <Textarea
        label="Biography"
        value={formData.bio}
        onChange={e => handleChange("bio", e.target.value)}
        placeholder="Write a brief biography..."
        rows={4}
      />

      {/* Relationships */}
      {availablePeople.length > 0 && (
        <div className="space-y-6 border-t border-border pt-6">
          <h3 className="font-display text-lg font-semibold text-foreground">Relationships</h3>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
              <User className="w-4 h-4" />
              Parents
            </label>
            <div className="flex flex-wrap gap-2">
              {availablePeople.filter(p => !isLiving || p.id !== formData.name).map(person => (
                <button
                  key={person.id}
                  type="button"
                  onClick={() => toggleArrayField("parent_ids", person.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm border transition-colors",
                    formData.parent_ids?.includes(person.id)
                      ? "bg-primary-600 text-white border-primary-600"
                      : "bg-background text-foreground border-border hover:bg-muted"
                  )}
                >
                  {person.name}
                  {person.birth_date && (
                    <span className="ml-1 text-xs opacity-75">
                      ({new Date(person.birth_date).getFullYear()}{person.death_date ? `–${new Date(person.death_date!).getFullYear()}` : "–Present"})
                    </span>
                  )}
                </button>
              ))}
              {availablePeople.length === 0 && (
                <span className="text-sm text-muted-foreground">No other family members available</span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Spouses / Partners
            </label>
            <div className="flex flex-wrap gap-2">
              {availablePeople
                .filter(p => !formData.parent_ids?.includes(p.id))
                .map(person => (
                  <button
                    key={person.id}
                    type="button"
                    onClick={() => toggleArrayField("spouse_ids", person.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm border transition-colors",
                      formData.spouse_ids?.includes(person.id)
                        ? "bg-primary-600 text-white border-primary-600"
                        : "bg-background text-foreground border-border hover:bg-muted"
                    )}
                  >
                    {person.name}
                    {person.birth_date && (
                      <span className="ml-1 text-xs opacity-75">
                        ({new Date(person.birth_date).getFullYear()}{person.death_date ? `–${new Date(person.death_date!).getFullYear()}` : "–Present"})
                      </span>
                    )}
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-end border-t border-border pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading || !formData.name}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {initialData.name ? "Update" : "Add"} Family Member
            </>
          )}
        </Button>
      </div>
    </form>
  );
}