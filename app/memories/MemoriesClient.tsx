"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import { Plus, Search, Filter, Loader2, Heart, Utensils, Quote, BookOpen, Sparkles, Calendar } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";
import { useFamily } from "@/hooks/useFamily";
import { cn } from "@/lib/utils";

const MEMORY_TYPES = [
  { value: "testimony", label: "Testimony", icon: Heart },
  { value: "memory", label: "Memory", icon: Sparkles },
  { value: "quote", label: "Quote", icon: Quote },
  { value: "recipe", label: "Recipe", icon: Utensils },
  { value: "tradition", label: "Tradition", icon: BookOpen },
  { value: "custom", label: "Custom", icon: Calendar },
];

interface Memory {
  id: string;
  family_id: string;
  author_id: string;
  person_id: string | null;
  title: string;
  content: string;
  memory_type: string;
  date: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  author?: { full_name: string; avatar_url?: string };
  person?: { name: string };
}

export function MemoriesClient() {
  const { family } = useFamily();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    memory_type: "memory",
    date: "",
    tags: "",
    person_id: "",
  });
  const [people, setPeople] = useState<{ id: string; name: string }[]>([]);

  const fetchData = async () => {
    if (!family) return;
    setLoading(true);

    try {
      const supabase = createClient();

      const [memoriesRes, peopleRes] = await Promise.all([
        supabase
          .from("memories")
          .select(`
            *,
            author:profiles!author_id(full_name, avatar_url),
            person:person_id(name)
          `)
          .eq("family_id", family.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("people")
          .select("id, name")
          .eq("family_id", family.id)
          .order("name"),
      ]);

      if (memoriesRes.error) throw memoriesRes.error;
      if (peopleRes.error) throw peopleRes.error;

      setMemories(memoriesRes.data || []);
      setPeople(peopleRes.data || []);
    } catch (error) {
      console.error("Failed to load memories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [family]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error("Not authenticated");
      if (!family) throw new Error("No family selected");

      const { error } = await supabase
        .from("memories")
        .insert({
          family_id: family.id,
          author_id: user.id,
          person_id: formData.person_id || null,
          title: formData.title,
          content: formData.content,
          memory_type: formData.memory_type,
          date: formData.date || null,
          tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean),
        });

      if (error) throw error;

      setShowForm(false);
      setFormData({ title: "", content: "", memory_type: "memory", date: "", tags: "", person_id: "" });
      fetchData();
    } catch (error) {
      console.error("Failed to create memory:", error);
      alert("Failed to create memory");
    } finally {
      setCreating(false);
    }
  };

  const filteredMemories = memories.filter((memory) => {
    const matchesSearch = memory.title.toLowerCase().includes(search.toLowerCase()) ||
      memory.content.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || memory.memory_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const typeConfig = MEMORY_TYPES.find(t => t.value === typeFilter);
  const memoryTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    testimony: Heart,
    memory: Sparkles,
    quote: Quote,
    recipe: Utensils,
    tradition: BookOpen,
    custom: Calendar,
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Memories & Testimonies</h1>
          <p className="text-muted-foreground mt-1">Preserve quotes, recipes, traditions, and family stories</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Memory
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search memories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-md"
              />
            </div>
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              options={[
                { value: "all", label: "All Types" },
                ...MEMORY_TYPES.map(t => ({ value: t.value, label: t.label })),
              ]}
              className="w-48"
            />
          </div>
        </CardContent>
      </Card>

      {/* Create Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowForm(false)}>
          <div className="bg-card rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Add New Memory</h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <Input
                label="Title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="A memorable title..."
                required
              />

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Type</label>
                <div className="flex flex-wrap gap-2">
                  {MEMORY_TYPES.map(type => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, memory_type: type.value }))}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm border transition-colors flex items-center gap-1",
                        formData.memory_type === type.value
                          ? "bg-primary-600 text-white border-primary-600"
                          : "bg-background text-foreground border-border hover:bg-muted"
                      )}
                    >
                      <type.icon className="w-4 h-4" />
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              <Textarea
                label="Content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Share the memory, quote, recipe, or tradition..."
                rows={6}
                required
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Date (optional)"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  max={new Date().toISOString().split("T")[0]}
                />

                <Select
                  label="Person (optional)"
                  value={formData.person_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, person_id: e.target.value }))}
                  options={[
                    { value: "", label: "No specific person" },
                    ...people.map(p => ({ value: p.id, label: p.name })),
                  ]}
                />
              </div>

              <Input
                label="Tags (comma-separated)"
                value={formData.tags}
                onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="family, tradition, holiday, grandmother"
              />

              <div className="flex gap-3 justify-end pt-4">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Memory"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Memories Grid */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-6 bg-muted rounded w-1/3 mb-3" />
                <div className="h-4 bg-muted rounded w-full mb-2" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredMemories.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" aria-hidden="true" />
            <h3 className="font-display text-lg font-semibold text-foreground mb-2">
              {search || typeFilter !== "all" ? "No memories found" : "No memories yet"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {search || typeFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Start preserving your family's memories today"}
            </p>
            {!search && typeFilter === "all" && (
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Memory
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredMemories.map((memory) => {
            const Icon = memoryTypeIcons[memory.memory_type] || Sparkles;
            return (
              <Card key={memory.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Icon className="w-5 h-5 text-primary-600" aria-hidden="true" />
                      <span className="text-sm font-medium text-muted-foreground capitalize">{memory.memory_type}</span>
                    </div>
                    {memory.date && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(memory.date)}
                      </span>
                    )}
                  </div>
                  <h3 className="font-display text-lg font-semibold text-foreground mb-2">{memory.title}</h3>
                  <p className="text-muted-foreground text-sm mb-3 line-clamp-3">{memory.content}</p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {memory.tags.slice(0, 4).map(tag => (
                      <span key={tag} className="px-2 py-0.5 text-xs bg-muted rounded-full text-muted-foreground">{tag}</span>
                    ))}
                    {memory.tags.length > 4 && (
                      <span className="px-2 py-0.5 text-xs text-muted-foreground">+{memory.tags.length - 4}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {memory.person && (
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        {memory.person.name}
                      </span>
                    )}
                    {memory.author && (
                      <span className="flex items-center gap-1">
                        <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs">
                          {memory.author.full_name?.[0] || "U"}
                        </span>
                        {memory.author.full_name}
                      </span>
                    )}
                    <span>{formatRelativeTime(memory.created_at)}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { Textarea } from "@/components/ui/Input";