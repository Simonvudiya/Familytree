"use client";

import { useState } from "react";
import { formatLifespan, calculateAge } from "@/lib/utils";
import { Person } from "@/types/person";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Loader2, Edit, MapPin, Calendar, Heart, Users, User, BookOpen, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface PersonProfileClientProps {
  person: Person & {
    parents?: Person[];
    children?: Person[];
    spouses?: Person[];
    siblings?: Person[];
    stories?: { id: string; title: string; status: string }[];
    timeline_events?: { id: string; title: string; date: string; event_type: string }[];
  };
}

export function PersonProfileClient({ person }: PersonProfileClientProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "relationships" | "stories" | "timeline">("overview");
  const [editing, setEditing] = useState(false);

  const lifespan = formatLifespan(person.birth_date, person.death_date, person.is_living);
  const age = person.birth_date ? calculateAge(person.birth_date, person.death_date) : null;

  const tabs = [
    { id: "overview", label: "Overview", icon: User },
    { id: "relationships", label: "Relationships", icon: Users },
    { id: "stories", label: "Stories", icon: BookOpen },
    { id: "timeline", label: "Timeline", icon: Clock },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">{person.name}</h1>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" aria-hidden="true" />
                {lifespan}
              </span>
              {age !== null && (
                <span className="flex items-center gap-1">
                  <Heart className="w-4 h-4" aria-hidden="true" />
                  {person.is_living ? `${age} years old` : `Died at age ${age}`}
                </span>
              )}
              {person.birth_place && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" aria-hidden="true" />
                  Born in {person.birth_place}
                </span>
              )}
              {person.death_place && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" aria-hidden="true" />
                  Died in {person.death_place}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditing(true)}>
              <Edit className="w-4 h-4 mr-2" aria-hidden="true" />
              Edit
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-border">
          <nav className="flex gap-1" role="tablist">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={cn(
                  "px-4 py-3 text-sm font-medium rounded-t-lg transition-colors border-b-2 -mb-px",
                  activeTab === tab.id
                    ? "border-primary-600 text-primary-600"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <tab.icon className="w-4 h-4 inline mr-1" aria-hidden="true" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {person.bio && (
              <Card>
                <CardHeader>
                  <CardTitle>Biography</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">{person.bio}</div>
                </CardContent>
              </Card>
            )}

            {person.stories && person.stories.length > 0 && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Featured in Stories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {person.stories.map((story) => (
                      <a
                        key={story.id}
                        href={`/stories/${story.id}`}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
                      >
                        <span className="font-medium">{story.title}</span>
                        <span className="text-xs text-muted-foreground capitalize">{story.status}</span>
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {person.timeline_events && person.timeline_events.length > 0 && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Timeline Events</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {person.timeline_events.slice(0, 10).map((event) => (
                      <a
                        key={event.id}
                        href={`/timeline?event=${event.id}`}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                      >
                        <div className="w-10 h-10 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0">
                          <Clock className="w-5 h-5" aria-hidden="true" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{event.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(event.date).toLocaleDateString()} · {event.event_type}
                          </p>
                        </div>
                      </a>
                    ))}
                    {person.timeline_events.length > 10 && (
                      <a href="/timeline" className="text-sm text-primary-600 hover:text-primary-700">
                        View all {person.timeline_events.length} events →
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="w-32 h-32 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-4xl font-display font-bold mx-auto mb-4">
                    {person.profile_image ? (
                      <img src={person.profile_image} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      person.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
                    )}
                  </div>
                  <h2 className="font-display text-xl font-semibold">{person.name}</h2>
                  <p className="text-muted-foreground mt-1">{lifespan}</p>
                  {person.sex && (
                    <span className="inline-block mt-2 px-3 py-1 text-xs bg-muted rounded-full capitalize">{person.sex}</span>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" aria-hidden="true" />
                  Key Dates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3 text-sm">
                  {person.birth_date && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Born</dt>
                      <dd className="font-medium">{new Date(person.birth_date).toLocaleDateString()}</dd>
                    </div>
                  )}
                  {person.birth_place && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Birth Place</dt>
                      <dd className="font-medium">{person.birth_place}</dd>
                    </div>
                  )}
                  {person.death_date && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Died</dt>
                      <dd className="font-medium">{new Date(person.death_date).toLocaleDateString()}</dd>
                    </div>
                  )}
                  {person.death_place && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Death Place</dt>
                      <dd className="font-medium">{person.death_place}</dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "relationships" && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Parents", people: person.parents || [], icon: Users },
            { label: "Spouses", people: person.spouses || [], icon: Heart },
            { label: "Children", people: person.children || [], icon: Users },
            { label: "Siblings", people: person.siblings || [], icon: Users },
          ].map((group) => (
            <Card key={group.label}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <group.icon className="w-4 h-4" aria-hidden="true" />
                  {group.label} ({group.people.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {group.people.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">No {group.label.toLowerCase()} recorded</p>
                ) : (
                  <div className="space-y-2">
                    {group.people.map((p) => (
                      <a
                        key={p.id}
                        href={`/people/${p.id}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-medium">
                          {p.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{p.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatLifespan(p.birth_date, p.death_date, p.is_living)}
                          </p>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === "stories" && (
        <div>
          {person.stories && person.stories.length > 0 ? (
            <div className="space-y-3">
              {person.stories.map((story) => (
                <a
                  key={story.id}
                  href={`/stories/${story.id}`}
                  className="flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:border-primary-300 hover:shadow-md transition-all"
                >
                  <div>
                    <h3 className="font-medium text-foreground">{story.title}</h3>
                    <p className="text-sm text-muted-foreground">Status: {story.status}</p>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 pb-6 text-center">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" aria-hidden="true" />
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">No stories yet</h3>
                <p className="text-muted-foreground mb-4">This person hasn't been featured in any stories.</p>
                <a href="/stories/new" className="inline-flex h-10 items-center justify-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700">
                  Write a story about them
                </a>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === "timeline" && (
        <div>
          {person.timeline_events && person.timeline_events.length > 0 ? (
            <div className="space-y-3">
              {person.timeline_events.map((event) => (
                <a
                  key={event.id}
                  href={`/timeline?event=${event.id}`}
                  className="flex items-start gap-4 p-4 bg-card border border-border rounded-xl hover:border-primary-300 hover:shadow-md transition-all"
                >
                  <div className="w-12 h-12 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground">{event.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(event.date).toLocaleDateString()} · {event.event_type}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 pb-6 text-center">
                <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" aria-hidden="true" />
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">No timeline events</h3>
                <p className="text-muted-foreground mb-4">This person doesn't have any timeline events yet.</p>
                <a href="/timeline/new" className="inline-flex h-10 items-center justify-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700">
                  Add a timeline event
                </a>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {editing && (
        <EditPersonModal person={person} onClose={() => setEditing(false)} />
      )}
    </div>
  );
}

function EditPersonModal({ person, onClose }: { person: Person; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-card rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Edit {person.name}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <div className="p-6">
          <p className="text-muted-foreground text-center">Edit form coming soon...</p>
          <Button className="w-full mt-4" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}