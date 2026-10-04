"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Filter, Loader2 } from "lucide-react";
import { StoryCard } from "@/components/stories/StoryCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";
import { Story, StoryStatus } from "@/types/story";
import { useFamily } from "@/hooks/useFamily";

export function StoriesClient() {
  const { family } = useFamily();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StoryStatus | "all">("all");
  const [sortBy, setSortBy] = useState<"updated" | "created" | "title">("updated");

  const fetchStories = async () => {
    if (!family) return;
    setLoading(true);

    try {
      const supabase = createClient();
      let query = supabase
        .from("stories")
        .select(`
          *,
          author:profiles!author_id(id, full_name, avatar_url)
        `)
        .eq("family_id", family.id)
        .order("updated_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      if (search) {
        query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%,excerpt.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setStories(data || []);
    } catch (error) {
      console.error("Failed to load stories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, [family, statusFilter, search, sortBy]);

  const filteredStories = [...stories].sort((a, b) => {
    if (sortBy === "title") return a.title.localeCompare(b.title);
    const dateA = new Date(a[sortBy === "created" ? "created_at" : "updated_at"]).getTime();
    const dateB = new Date(b[sortBy === "created" ? "created_at" : "updated_at"]).getTime();
    return dateB - dateA;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Family Stories</h1>
          <p className="text-muted-foreground mt-1">Discover and preserve your family's narratives</p>
        </div>
        <Link href="/stories/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
            Write Story
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search stories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md"
          />
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StoryStatus | "all")}
            options={[
              { value: "all", label: "All Status" },
              { value: "draft", label: "Draft" },
              { value: "review", label: "In Review" },
              { value: "published", label: "Published" },
              { value: "archived", label: "Archived" },
            ]}
            className="w-40"
          />
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "updated" | "created" | "title")}
            options={[
              { value: "updated", label: "Recently Updated" },
              { value: "created", label: "Recently Created" },
              { value: "title", label: "A-Z" },
            ]}
            className="w-40"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-6 bg-muted rounded w-3/4 mb-3" />
                <div className="h-4 bg-muted rounded w-1/2 mb-2" />
                <div className="h-4 bg-muted rounded w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredStories.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" aria-hidden="true" />
            <h3 className="font-display text-lg font-semibold text-foreground mb-2">
              {search || statusFilter !== "all" ? "No stories found" : "No stories yet"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {search || statusFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Start preserving your family's stories today"}
            </p>
            {!search && statusFilter === "all" && (
              <Link href="/stories/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
                  Write Your First Story
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredStories.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>
      )}
    </div>
  );
}