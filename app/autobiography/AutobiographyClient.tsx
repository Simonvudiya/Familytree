"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, BookOpen, Loader2, CheckCircle, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";
import { useFamily } from "@/hooks/useFamily";

const CHAPTERS = [
  { id: 1, title: "Early Years", description: "Birth, childhood home, family, early memories", questions: 3 },
  { id: 2, title: "Growing Up", description: "School, friends, hobbies, teenage years", questions: 3 },
  { id: 3, title: "Coming of Age", description: "Young adulthood, first job, independence", questions: 3 },
  { id: 4, title: "Love & Marriage", description: "Meeting spouse, courtship, wedding, early marriage", questions: 3 },
  { id: 5, title: "Parenthood", description: "Children, parenting joys & challenges, family traditions", questions: 3 },
  { id: 6, title: "Career & Work", description: "Professional life, achievements, colleagues, retirement", questions: 3 },
  { id: 7, title: "Faith & Values", description: "Spiritual journey, core beliefs, life lessons", questions: 3 },
  { id: 8, title: "Historical Events", description: "World events witnessed, how they shaped you", questions: 3 },
  { id: 9, title: "Travel & Adventures", description: "Places visited, memorable trips, cultural experiences", questions: 3 },
  { id: 10, title: "Challenges Overcome", description: "Difficult times, resilience, what you learned", questions: 3 },
  { id: 11, title: "Legacy & Wisdom", description: "Advice for future generations, hopes & dreams", questions: 3 },
  { id: 12, title: "Final Reflections", description: "Looking back, gratitude, closing thoughts", questions: 3 },
];

interface Session {
  id: string;
  person_id: string;
  person_name: string;
  status: string;
  current_chapter: number;
  completed_chapters: number[];
  total_chapters: number;
  created_at: string;
  updated_at: string;
  people?: { id: string; name: string } | null;
}

export function AutobiographyClient() {
  const router = useRouter();
  const { family } = useFamily();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<string>("");
  const [people, setPeople] = useState<{ id: string; name: string }[]>([]);

  const fetchData = async () => {
    if (!family) return;
    setLoading(true);

    try {
      const supabase = createClient();

      const [sessionsRes, peopleRes] = await Promise.all([
        supabase
          .from("autobiography_sessions")
          .select(`
            *,
            people:person_id(id, name)
          `)
          .eq("family_id", family.id)
          .order("updated_at", { ascending: false }),
        supabase
          .from("people")
          .select("id, name")
          .eq("family_id", family.id)
          .eq("is_living", true)
          .order("name"),
      ]);

      if (sessionsRes.error) throw sessionsRes.error;
      if (peopleRes.error) throw peopleRes.error;

      setSessions(sessionsRes.data || []);
      setPeople(peopleRes.data || []);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [family]);

  const createSession = async () => {
    if (!selectedPerson || !family) return;
    setCreating(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("autobiography_sessions")
        .insert({
          family_id: family.id,
          person_id: selectedPerson,
          interviewer_id: user?.id,
          status: "in_progress",
          current_chapter: 1,
          total_chapters: CHAPTERS.length,
          completed_chapters: [],
        })
        .select()
        .single();

      if (error) throw error;

      setSelectedPerson("");
      router.push(`/autobiography/${data.id}`);
    } catch (error) {
      console.error("Failed to create session:", error);
    } finally {
      setCreating(false);
    }
  };

  const getProgress = (session: Session) => {
    return Math.round((session.completed_chapters.length / session.total_chapters) * 100);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "in_progress": return <Clock className="w-5 h-5 text-primary-600" />;
      default: return <BookOpen className="w-5 h-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground">Guided Autobiography</h1>
        <p className="text-muted-foreground mt-1">
          Help your loved ones preserve their life story with thoughtful, chapter-by-chapter questions
        </p>
      </div>

      {/* Create New Session */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Start New Autobiography
            {people.length === 0 && (
              <span className="text-sm font-normal text-muted-foreground">Add family members first</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <select
              value={selectedPerson}
              onChange={(e) => setSelectedPerson(e.target.value)}
              disabled={creating || people.length === 0}
              className="flex-1 px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select a family member...</option>
              {people.map((person) => (
                <option key={person.id} value={person.id}>{person.name}</option>
              ))}
            </select>
            <Button onClick={createSession} disabled={creating || !selectedPerson || people.length === 0}>
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Start Session"}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Choose a living family member to begin their guided autobiography journey.
          </p>
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <div>
        <h2 className="font-display text-xl font-semibold text-foreground mb-4">Active Sessions</h2>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="pt-6">
                  <div className="h-6 bg-muted rounded w-1/3 mb-4" />
                  <div className="h-4 bg-muted rounded w-full mb-2" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" aria-hidden="true" />
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">No autobiography sessions yet</h3>
              <p className="text-muted-foreground mb-4">
                Start a new session above to begin preserving a loved one's life story.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sessions.map((session) => (
              <Card key={session.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-display text-lg font-semibold text-foreground">
                        {session.people?.name || "Unknown"}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Started {new Date(session.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(session.status)}
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{getProgress(session)}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-600 rounded-full transition-all duration-300"
                        style={{ width: `${getProgress(session)}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <p className="text-muted-foreground">
                      Chapter {session.current_chapter} of {session.total_chapters}:{" "}
                      <span className="font-medium text-foreground">{CHAPTERS[session.current_chapter - 1]?.title}</span>
                    </p>
                    <p className="text-muted-foreground">
                      {session.completed_chapters.length} of {session.total_chapters} chapters completed
                    </p>
                  </div>

                  <Link
                    href={`/autobiography/${session.id}`}
                    className="mt-4 block text-center"
                  >
                    <Button className="w-full">
                      {session.status === "completed" ? "View Completed Story" : "Continue Interview"}
                      <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Chapter Overview */}
        <div className="mt-12">
          <h2 className="font-display text-xl font-semibold text-foreground mb-4">Chapter Structure</h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {CHAPTERS.map((chapter) => (
              <Card key={chapter.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center font-display font-bold text-lg flex-shrink-0">
                      {chapter.id}
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">{chapter.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{chapter.description}</p>
                      <p className="text-xs text-primary-600 mt-1">{chapter.questions} questions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}