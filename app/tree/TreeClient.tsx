"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Plus, Search, ZoomIn, ZoomOut, Expand, TreePine } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";
import { Person } from "@/types/person";
import { useFamily } from "@/hooks/useFamily";

export function TreeClient() {
  const { family } = useFamily();
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [centerPerson, setCenterPerson] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [viewMode, setViewMode] = useState<"tree" | "list">("tree");
  const containerRef = useRef<HTMLDivElement>(null);

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
      if (data && data.length > 0 && !centerPerson) {
        setCenterPerson(data[0].id);
      }
    } catch (error) {
      console.error("Failed to load people:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeople();
  }, [family]);

  const filteredPeople = people.filter((person) =>
    person.name.toLowerCase().includes(search.toLowerCase())
  );

  const getRelationships = (personId: string) => {
    // This would be populated from relationships table in real implementation
    return { parents: [], children: [], spouses: [] };
  };

  const handleZoomIn = () => setZoom(z => Math.min(2, z + 0.1));
  const handleZoomOut = () => setZoom(z => Math.max(0.5, z - 0.1));
  const handleResetZoom = () => setZoom(1);

  if (viewMode === "list") {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Family Members</h1>
            <p className="text-muted-foreground mt-1">Browse all family members</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setViewMode("tree")}>
              <TreePine className="w-4 h-4 mr-2" aria-hidden="true" />
              Tree View
            </Button>
            <Link href="/people/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
                Add Person
              </Button>
            </Link>
          </div>
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
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="pt-6">
                  <div className="w-14 h-14 rounded-full bg-muted mb-3 mx-auto" />
                  <div className="h-5 bg-muted rounded w-3/4 mb-1 mx-auto" />
                  <div className="h-4 bg-muted rounded w-1/2 mx-auto" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredPeople.map((person) => (
              <Card key={person.id} className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => { setCenterPerson(person.id); setViewMode("tree"); }}>
                <CardContent className="pt-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xl font-display font-bold mx-auto mb-3">
                    {person.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                  </div>
                  <h3 className="font-medium text-foreground">{person.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {person.birth_date ? new Date(person.birth_date).getFullYear() : "?"}
                    {person.death_date ? `–${new Date(person.death_date).getFullYear()}` : person.is_living ? "–Present" : "–?"}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Toolbar */}
      <div className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <h1 className="font-display text-xl font-bold text-foreground">Family Tree</h1>
              <div className="flex items-center gap-2 border-l border-border pl-4">
                <Button variant="outline" size="sm" onClick={handleZoomOut} aria-label="Zoom out">
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-sm font-mono text-muted-foreground w-16 text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <Button variant="outline" size="sm" onClick={handleZoomIn} aria-label="Zoom in">
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleResetZoom} aria-label="Reset zoom">
                  <Expand className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  placeholder="Search people..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button variant="outline" onClick={() => setViewMode("list")}>
                <TreePine className="w-4 h-4 mr-2" aria-hidden="true" />
                List View
              </Button>
              <Link href="/people/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
                  Add Person
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Tree Canvas */}
      <div className="flex-1 overflow-auto relative" ref={containerRef}>
        <div
          className="transform transition-transform duration-200"
          style={{ transform: `scale(${zoom})`, transformOrigin: "center top" }}
        >
          <div className="min-h-[1000px] relative">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" aria-hidden="true" />
              </div>
            ) : people.length === 0 ? (
              <div className="flex items-center justify-center h-full text-center">
                <div className="p-8">
                  <TreePine className="w-16 h-16 text-muted-foreground mx-auto mb-4" aria-hidden="true" />
                  <h2 className="font-display text-xl font-semibold text-foreground mb-2">No family members yet</h2>
                  <p className="text-muted-foreground mb-6">Start building your family tree</p>
                  <Link href="/people/new">
                    <Button>Add First Family Member</Button>
                  </Link>
                </div>
              </div>
            ) : (
              <FamilyTreeView
                people={people}
                centerPersonId={centerPerson}
                onCenterPersonChange={setCenterPerson}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FamilyTreeView({ people, centerPersonId, onCenterPersonChange }: {
  people: Person[];
  centerPersonId: string | null;
  onCenterPersonChange: (id: string) => void;
}) {
  const personMap = new Map(people.map(p => [p.id, p]));
  const centerPerson = centerPersonId ? personMap.get(centerPersonId) : people[0];

  if (!centerPerson) return null;

  // Simple tree layout - in production use a proper tree layout algorithm
  const getGeneration = (person: Person): number => {
    // This would be computed from relationships in real implementation
    return person.generation || 1;
  };

  const generations = new Map<number, Person[]>();
  people.forEach(p => {
    const gen = getGeneration(p);
    if (!generations.has(gen)) generations.set(gen, []);
    generations.get(gen)!.push(p);
  });

  const sortedGenerations = Array.from(generations.entries()).sort((a, b) => a[0] - b[0]);

  return (
    <div className="px-8 py-12">
      {sortedGenerations.map(([gen, genPeople]) => (
        <div key={gen} className="mb-16">
          <div className="text-center mb-4">
            <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
              Generation {gen}
            </span>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {genPeople.map((person) => (
              <PersonTreeNode
                key={person.id}
                person={person}
                isCenter={person.id === centerPersonId}
                onClick={() => onCenterPersonChange(person.id)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function PersonTreeNode({ person, isCenter, onClick }: { person: Person; isCenter: boolean; onClick: () => void }) {
  const initials = person.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  const lifespan = person.birth_date ? `${new Date(person.birth_date).getFullYear()}${person.death_date ? `–${new Date(person.death_date).getFullYear()}` : person.is_living ? "–Present" : ""}` : "";

  return (
    <button
      onClick={onClick}
      className={`relative group w-40 transition-all duration-200 ${
        isCenter ? "ring-2 ring-primary-500 ring-offset-2" : ""
      }`}
      aria-pressed={isCenter}
    >
      <div className="text-center">
        <div className={`w-20 h-20 rounded-full mx-auto mb-2 flex items-center justify-center font-display font-bold text-xl transition-transform group-hover:scale-110 ${
          isCenter ? "bg-primary-600 text-white shadow-lg" : "bg-primary-100 text-primary-600"
        }`}>
          {initials}
        </div>
        <p className="font-medium text-foreground text-sm truncate">{person.name}</p>
        {lifespan && <p className="text-xs text-muted-foreground">{lifespan}</p>}
      </div>
      {isCenter && (
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-2 py-1 bg-primary-600 text-white text-xs rounded whitespace-nowrap">
          Center Person
        </div>
      )}
    </button>
  );
}