"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Loader2 } from "lucide-react";
import { PersonCard } from "@/components/people/PersonCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { Person } from "@/types/person";
import { useFamily } from "@/hooks/useFamily";

export function PeopleClient() {
  const { family } = useFamily();
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "living" | "deceased">("all");

  const fetchPeople = async () => {
    if (!family) return;
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("people")
        .select("*")
        .eq("family_id", family.id)
        .order("name");

      if (error) throw error;
      setPeople(data || []);
    } catch (error) {
      console.error("Failed to load people:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeople();
  }, [family]);

  const filteredPeople = people.filter((person) => {
    const matchesSearch = person.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || (filter === "living" && person.is_living) || (filter === "deceased" && !person.is_living);
    return matchesSearch && matchesFilter;
  });

  const livingCount = people.filter((p) => p.is_living).length;
  const deceasedCount = people.filter((p) => !p.is_living).length;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Family Members</h1>
          <p className="text-muted-foreground mt-1">
            {people.length} members · {livingCount} living · {deceasedCount} deceased
          </p>
        </div>
        <Link href="/people/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
            Add Person
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search family members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md"
          />
        </div>
        <div className="flex gap-2">
          {["all", "living", "deceased"].map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f as "all" | "living" | "deceased")}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="w-14 h-14 rounded-full bg-muted mb-3" />
              <div className="h-5 bg-muted rounded w-3/4 mb-1" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredPeople.length === 0 ? (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" aria-hidden="true" />
          <h3 className="font-display text-lg font-semibold text-foreground mb-2">
            {search || filter !== "all" ? "No members found" : "No family members yet"}
          </h3>
          <p className="text-muted-foreground mb-4">
            {search || filter !== "all"
              ? "Try adjusting your search or filters"
              : "Start building your family tree by adding your first member"}
          </p>
          {!search && filter === "all" && (
            <Link href="/people/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
                Add First Family Member
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredPeople.map((person) => (
            <PersonCard key={person.id} person={person} />
          ))}
        </div>
      )}
    </div>
  );
}