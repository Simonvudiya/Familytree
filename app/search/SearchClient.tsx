"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { BookOpen, CalendarDays, FileText, Loader2, Search, UserRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useFamily } from "@/hooks/useFamily";

interface SearchResult {
  id: string;
  type: string;
  title: string;
  snippet?: string;
  url: string;
}

const icons = {
  person: UserRound,
  story: BookOpen,
  event: CalendarDays,
  document: FileText,
  memory: BookOpen,
};

export function SearchClient() {
  const { family } = useFamily();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!family || !query.trim()) return;
    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const params = new URLSearchParams({ family_id: family.id, q: query.trim() });
      const response = await fetch(`/api/search?${params.toString()}`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Search failed");
      setResults(result.results || []);
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : "Search failed. Please try again.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container mx-auto max-w-4xl px-4 py-10">
      <header className="mb-8">
        <p className="text-sm font-medium text-primary-600">Family archive</p>
        <h1 className="mt-1 font-display text-3xl font-bold">Search your family history</h1>
        <p className="mt-2 text-muted-foreground">Find people, stories, memories, events, and documents.</p>
      </header>

      <form onSubmit={submitSearch} className="flex flex-col gap-3 sm:flex-row">
        <Input
          label="Search terms"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Try a name, place, or memory"
          className="h-12"
          required
        />
        <Button type="submit" className="mt-auto h-12" disabled={!family || loading || !query.trim()}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
          Search
        </Button>
      </form>

      {!family && <p className="mt-4 text-sm text-muted-foreground">Join a family to search its archive.</p>}
      {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}

      {searched && !loading && !error && (
        <section className="mt-8" aria-live="polite">
          <div className="mb-3 flex items-center justify-between border-b border-border pb-3">
            <h2 className="font-display text-lg font-semibold">Results</h2>
            <span className="text-sm text-muted-foreground">{results.length} found</span>
          </div>
          {results.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No matches for “{query}”. Try another name or phrase.</p>
          ) : (
            <div className="divide-y divide-border">
              {results.map((result) => {
                const Icon = icons[result.type as keyof typeof icons] || FileText;
                const href = result.type === "document"
                  ? "/documents"
                  : result.type === "memory"
                    ? "/memories"
                    : result.url;
                return (
                  <Link key={`${result.type}-${result.id}`} href={href} className="flex gap-4 py-5 hover:bg-muted/40">
                    <Icon className="mt-0.5 h-5 w-5 flex-none text-primary-600" aria-hidden="true" />
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-baseline gap-2">
                        <span className="font-medium text-foreground">{result.title}</span>
                        <span className="text-xs capitalize text-muted-foreground">{result.type}</span>
                      </span>
                      {result.snippet && <span className="mt-1 block text-sm text-muted-foreground">{result.snippet}</span>}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      )}
    </main>
  );
}