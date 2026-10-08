"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { Plus, Search, Filter, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";
import { TimelineEvent, EventType } from "@/types/timeline";
import { useFamily } from "@/hooks/useFamily";

export function TimelineClient() {
  const { family } = useFamily();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<EventType | "all">("all");
  const [viewMode, setViewMode] = useState<"timeline" | "list">("timeline");
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const fetchEvents = async () => {
    if (!family) return;
    setLoading(true);

    try {
      const supabase = createClient();
      let query = supabase
        .from("timeline_events")
        .select(`
          *,
          timeline_event_people(people:person_id(id, name, birth_date, death_date)),
          timeline_event_media(*)
        `)
        .eq("family_id", family.id)
        .order("date", { ascending: true });

      if (typeFilter !== "all") {
        query = query.eq("event_type", typeFilter);
      }

      if (search) {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,location.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Failed to load timeline events:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [family, typeFilter, search]);

  const filteredEvents = events.filter((event) => {
    const eventYear = new Date(event.date).getFullYear();
    return viewMode === "list" || eventYear === selectedYear;
  });

  const eventsByYear = filteredEvents.reduce((acc, event) => {
    const year = new Date(event.date).getFullYear();
    if (!acc[year]) acc[year] = [];
    acc[year].push(event);
    return acc;
  }, {} as Record<number, TimelineEvent[]>);

  const years = Array.from(new Set(events.map(e => new Date(e.date).getFullYear()))).sort((a, b) => b - a);
  const minYear = years.length ? Math.min(...years) : new Date().getFullYear();
  const maxYear = years.length ? Math.max(...years) : new Date().getFullYear();

  const eventTypeColors: Record<EventType, string> = {
    birth: "bg-green-100 text-green-700",
    death: "bg-red-100 text-red-700",
    marriage: "bg-pink-100 text-pink-700",
    divorce: "bg-gray-100 text-gray-700",
    graduation: "bg-blue-100 text-blue-700",
    career: "bg-purple-100 text-purple-700",
    military: "bg-orange-100 text-orange-700",
    migration: "bg-cyan-100 text-cyan-700",
    achievement: "bg-yellow-100 text-yellow-700",
    historical: "bg-indigo-100 text-indigo-700",
    custom: "bg-primary-100 text-primary-700",
  };

  const eventTypeIcons: Record<EventType, React.ComponentType<{ className?: string }>> = {
    birth: () => <span>👶</span>,
    death: () => <span>⚰️</span>,
    marriage: () => <span>💒</span>,
    divorce: () => <span>💔</span>,
    graduation: () => <span>🎓</span>,
    career: () => <span>💼</span>,
    military: () => <span>🎖️</span>,
    migration: () => <span>🌍</span>,
    achievement: () => <span>🏆</span>,
    historical: () => <span>📜</span>,
    custom: () => <span>📌</span>,
  };

  if (viewMode === "list") {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Family Timeline</h1>
            <p className="text-muted-foreground mt-1">View your family's history chronologically</p>
          </div>
          <Link href="/timeline/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
              Add Event
            </Button>
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-md"
            />
          </div>
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as EventType | "all")}
            options={[
              { value: "all", label: "All Types" },
              { value: "birth", label: "Birth" },
              { value: "death", label: "Death" },
              { value: "marriage", label: "Marriage" },
              { value: "career", label: "Career" },
              { value: "military", label: "Military" },
              { value: "migration", label: "Migration" },
              { value: "achievement", label: "Achievement" },
              { value: "historical", label: "Historical" },
              { value: "custom", label: "Custom" },
            ]}
            className="w-40"
          />
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-muted" />
                    <div className="flex-1">
                      <div className="h-5 bg-muted rounded w-3/4 mb-2" />
                      <div className="h-4 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" aria-hidden="true" />
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">No events found</h3>
              <p className="text-muted-foreground mb-4">Try adjusting your search or filters</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredEvents.map((event) => {
              const EventIcon = eventTypeIcons[event.event_type];
              return (
              <Card key={event.id}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: eventTypeColors[event.event_type].replace("bg-", "").replace(" text-", ""), color: eventTypeColors[event.event_type].replace("bg-", "").replace(" text-", "") }}>
                      <EventIcon className="text-2xl" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-foreground">{event.title}</h3>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${eventTypeColors[event.event_type]}`}>
                          {event.event_type}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {formatDate(event.date)} {event.location ? `· ${event.location}` : ""}
                      </p>
                      {event.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
                      )}
                      {event.timeline_event_people?.length && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {event.timeline_event_people.map((p) => (
                            <span key={p.people.id} className="px-2 py-0.5 text-xs bg-muted rounded-full text-muted-foreground">
                              {p.people.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{formatDate(event.date)}</span>
                    </div>
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Family Timeline</h1>
          <p className="text-muted-foreground mt-1">View your family's history chronologically</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setViewMode("list")}>
            List View
          </Button>
          <Link href="/timeline/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
              Add Event
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md"
          />
        </div>
        <Select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as EventType | "all")}
          options={[
            { value: "all", label: "All Types" },
            { value: "birth", label: "Birth" },
            { value: "death", label: "Death" },
            { value: "marriage", label: "Marriage" },
            { value: "career", label: "Career" },
            { value: "military", label: "Military" },
            { value: "migration", label: "Migration" },
            { value: "achievement", label: "Achievement" },
            { value: "historical", label: "Historical" },
            { value: "custom", label: "Custom" },
          ]}
          className="w-40"
        />
      </div>

      {/* Year Navigation */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" size="sm" onClick={() => setSelectedYear(y => Math.max(minYear, y - 1))} disabled={selectedYear <= minYear}>
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        </Button>
        <div className="text-center">
          <h2 className="font-display text-2xl font-bold text-foreground">{selectedYear}</h2>
          <p className="text-sm text-muted-foreground">
            {Object.keys(eventsByYear).length} year{Object.keys(eventsByYear).length !== 1 ? "s" : ""} with events
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setSelectedYear(y => Math.min(maxYear, y + 1))} disabled={selectedYear >= maxYear}>
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </Button>
      </div>

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" aria-hidden="true" />

        {eventsByYear[selectedYear] && eventsByYear[selectedYear].length > 0 ? (
          <div className="space-y-6">
            {eventsByYear[selectedYear].map((event) => {
              const EventIcon = eventTypeIcons[event.event_type];
              return (
              <div key={event.id} className="relative flex gap-6">
                <div className="absolute left-4 top-2 w-4 h-4 rounded-full border-4 border-card z-10"
                  style={{ backgroundColor: eventTypeColors[event.event_type].replace("bg-", "").replace(" text-", "") }} />
                <div className="flex-1 pl-16">
                  <Card>
                    <CardContent className="pt-4 pb-4 pr-4">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: eventTypeColors[event.event_type].replace("bg-", "").replace(" text-", "") }}>
                          <EventIcon className="text-xl" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-foreground">{event.title}</h3>
                            <span className={`px-2 py-0.5 text-xs rounded-full ${eventTypeColors[event.event_type]}`}>
                              {event.event_type}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {formatDate(event.date)} {event.location ? `· ${event.location}` : ""}
                          </p>
                          {event.description && (
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-3">{event.description}</p>
                          )}
                          {event.timeline_event_people?.length && (
                            <div className="flex flex-wrap gap-1">
                              {event.timeline_event_people.map((p) => (
                                <span key={p.people.id} className="px-2 py-0.5 text-xs bg-muted rounded-full text-muted-foreground">
                                  {p.people.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 pl-16">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" aria-hidden="true" />
            <h3 className="font-display text-lg font-semibold text-foreground mb-2">No events in {selectedYear}</h3>
            <p className="text-muted-foreground">Add events to see them on the timeline</p>
          </div>
        )}
      </div>

      {/* Year Picker */}
      <div className="mt-8">
        <p className="text-sm text-muted-foreground mb-2">Jump to year:</p>
        <div className="flex flex-wrap gap-1">
          {Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i).map((year) => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              className={cn(
                "px-3 py-1 text-sm rounded transition-colors",
                selectedYear === year
                  ? "bg-primary-600 text-white"
                  : "bg-muted text-foreground hover:bg-muted/80"
              )}
            >
              {year}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

import { cn } from "@/lib/utils";