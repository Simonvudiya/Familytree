"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";
import { Person } from "@/types/person";

interface Session {
  id: string;
  status: "not_started" | "in_progress" | "completed" | "archived";
  current_chapter: number;
  total_chapters: number;
  completed_chapters: number[];
}

interface Question {
  id: string;
  prompt: string;
}

interface Chapter {
  title: string;
  description: string;
  questions: Question[];
}

const CHAPTERS: Chapter[] = [
  { title: "Early Years", description: "Birth, childhood home, family, and early memories", questions: [
    { id: "early-home", prompt: "What is your earliest memory of home?" },
    { id: "early-family", prompt: "Who were the people you spent the most time with as a child?" },
    { id: "early-traditions", prompt: "What family traditions or everyday routines do you remember?" },
  ] },
  { title: "Growing Up", description: "School, friends, hobbies, and teenage years", questions: [
    { id: "growing-school", prompt: "What do you remember most about your school days?" },
    { id: "growing-friends", prompt: "Who were your closest friends, and what did you enjoy doing together?" },
    { id: "growing-interests", prompt: "What interests or hobbies mattered most to you growing up?" },
  ] },
  { title: "Coming of Age", description: "Young adulthood, first work, and independence", questions: [
    { id: "coming-first-job", prompt: "What was your first job, and what did it teach you?" },
    { id: "coming-independence", prompt: "When did you first feel independent or grown up?" },
    { id: "coming-decisions", prompt: "Which early decision had a lasting effect on your life?" },
  ] },
  { title: "Love & Marriage", description: "Relationships, courtship, and partnership", questions: [
    { id: "love-meeting", prompt: "How did you meet someone who became important in your life?" },
    { id: "love-courtship", prompt: "What do you remember about the early days of your relationship?" },
    { id: "love-partnership", prompt: "What has partnership taught you over the years?" },
  ] },
  { title: "Parenthood", description: "Children, parenting, and family traditions", questions: [
    { id: "parenthood-arrival", prompt: "What do you remember about becoming a parent or caring for children?" },
    { id: "parenthood-joys", prompt: "What are some moments with your family that still make you smile?" },
    { id: "parenthood-lessons", prompt: "What did raising a family teach you?" },
  ] },
  { title: "Career & Work", description: "Professional life, achievements, and retirement", questions: [
    { id: "career-path", prompt: "How did you choose your line of work?" },
    { id: "career-proud", prompt: "Which work accomplishment or experience are you proudest of?" },
    { id: "career-people", prompt: "Who influenced or encouraged you in your working life?" },
  ] },
  { title: "Faith & Values", description: "Beliefs, guiding principles, and life lessons", questions: [
    { id: "values-influence", prompt: "What experiences shaped your beliefs and values?" },
    { id: "values-guidance", prompt: "What principles have helped guide your choices?" },
    { id: "values-change", prompt: "Have any of your beliefs changed over time?" },
  ] },
  { title: "Historical Events", description: "World events you witnessed and their impact", questions: [
    { id: "history-memory", prompt: "Which major events from your lifetime do you remember most vividly?" },
    { id: "history-community", prompt: "How did those events affect your family or community?" },
    { id: "history-change", prompt: "What changes in the world have surprised you most?" },
  ] },
  { title: "Travel & Adventures", description: "Places visited and memorable experiences", questions: [
    { id: "travel-place", prompt: "What place has stayed with you most, and why?" },
    { id: "travel-adventure", prompt: "Tell us about an unexpected adventure or memorable trip." },
    { id: "travel-home", prompt: "What did traveling teach you about home or other people?" },
  ] },
  { title: "Challenges Overcome", description: "Difficult times, resilience, and learning", questions: [
    { id: "challenge-time", prompt: "What difficult period changed how you see yourself or the world?" },
    { id: "challenge-support", prompt: "Who or what helped you through a challenging time?" },
    { id: "challenge-learning", prompt: "What would you want someone facing a similar challenge to know?" },
  ] },
  { title: "Legacy & Wisdom", description: "Advice, hopes, and what you want remembered", questions: [
    { id: "legacy-advice", prompt: "What advice would you most like to pass on to younger generations?" },
    { id: "legacy-pride", prompt: "What do you hope your family remembers about you?" },
    { id: "legacy-hopes", prompt: "What hopes do you have for the generations that follow?" },
  ] },
  { title: "Final Reflections", description: "Looking back, gratitude, and closing thoughts", questions: [
    { id: "reflection-gratitude", prompt: "What are you most grateful for when you look back?" },
    { id: "reflection-surprise", prompt: "What about your life turned out differently than you expected?" },
    { id: "reflection-message", prompt: "Is there anything else you would like your family to know?" },
  ] },
];

interface Props {
  session: Session;
  person: Person;
}

export function AutobiographySessionClient({ session: initialSession, person }: Props) {
  const [session, setSession] = useState(initialSession);
  const [chapterIndex, setChapterIndex] = useState(Math.min(Math.max(initialSession.current_chapter - 1, 0), CHAPTERS.length - 1));
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const loadResponses = async () => {
      const supabase = createClient();
      const { data, error: loadError } = await supabase
        .from("autobiography_responses")
        .select("question_id, response")
        .eq("session_id", session.id);

      if (loadError) {
        setError("Your interview responses could not be loaded.");
      } else {
        setResponses(Object.fromEntries((data || []).map((item) => [item.question_id, item.response])));
      }
      setLoading(false);
    };

    loadResponses();
  }, [session.id]);

  const saveResponses = async (markComplete = false): Promise<boolean> => {
    setSaving(true);
    setSaved(false);
    setError(null);

    try {
      const supabase = createClient();
      const chapter = CHAPTERS[chapterIndex];
      const questionIds = chapter.questions.map((question) => question.id);
      const { data: existing, error: readError } = await supabase
        .from("autobiography_responses")
        .select("id, question_id")
        .eq("session_id", session.id)
        .in("question_id", questionIds);
      if (readError) throw readError;

      const existingByQuestion = new Map((existing || []).map((response) => [response.question_id, response.id]));
      for (const question of chapter.questions) {
        const response = (responses[question.id] || "").trim();
        const existingId = existingByQuestion.get(question.id);
        if (!response && !existingId) continue;

        const result = existingId
          ? await supabase.from("autobiography_responses").update({ response }).eq("id", existingId)
          : await supabase.from("autobiography_responses").insert({ session_id: session.id, question_id: question.id, response });
        if (result.error) throw result.error;
      }

      if (markComplete) {
        const completedChapters = Array.from(new Set([...session.completed_chapters, chapterIndex + 1])).sort((a, b) => a - b);
        const nextChapter = Math.min(chapterIndex + 2, CHAPTERS.length);
        const status = completedChapters.length === CHAPTERS.length ? "completed" : "in_progress";
        const { error: updateError } = await supabase
          .from("autobiography_sessions")
          .update({ completed_chapters: completedChapters, current_chapter: nextChapter, status })
          .eq("id", session.id);
        if (updateError) throw updateError;
        setSession({ ...session, completed_chapters: completedChapters, current_chapter: nextChapter, status });
      }

      setSaved(true);
      return true;
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Your responses could not be saved.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const chapter = CHAPTERS[chapterIndex];
  const isCompleted = session.completed_chapters.includes(chapterIndex + 1);

  return (
    <main className="container mx-auto max-w-4xl px-4 py-8">
      <Link href="/autobiography" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All sessions
      </Link>

      <header className="mb-8">
        <p className="text-sm font-medium text-primary-600">Guided autobiography</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-foreground">{person.name}&apos;s life story</h1>
        <p className="mt-2 text-muted-foreground">Take your time. You can return to any chapter and keep adding to these answers.</p>
      </header>

      <div className="mb-6" aria-label={`Chapter ${chapterIndex + 1} of ${CHAPTERS.length}`}>
        <div className="mb-2 flex justify-between text-sm">
          <span className="text-muted-foreground">Chapter {chapterIndex + 1} of {CHAPTERS.length}</span>
          <span className="font-medium">{session.completed_chapters.length} completed</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary-600 transition-all" style={{ width: `${(session.completed_chapters.length / CHAPTERS.length) * 100}%` }} />
        </div>
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-2" aria-label="Chapters">
        {CHAPTERS.map((item, index) => (
          <button
            key={item.title}
            type="button"
            aria-label={`Chapter ${index + 1}: ${item.title}${session.completed_chapters.includes(index + 1) ? ", completed" : ""}`}
            aria-current={index === chapterIndex ? "step" : undefined}
            onClick={() => setChapterIndex(index)}
            className={`flex h-9 w-9 flex-none items-center justify-center rounded-full border text-sm font-medium ${index === chapterIndex ? "border-primary-600 bg-primary-600 text-white" : "border-border bg-background text-muted-foreground"}`}
          >
            {session.completed_chapters.includes(index + 1) ? <Check className="h-4 w-4" aria-hidden="true" /> : index + 1}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Chapter {chapterIndex + 1}</p>
              <CardTitle className="mt-1">{chapter.title}</CardTitle>
              <p className="mt-2 text-sm text-muted-foreground">{chapter.description}</p>
            </div>
            {isCompleted && <span className="inline-flex items-center gap-1 text-sm font-medium text-green-700"><Check className="h-4 w-4" /> Completed</span>}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading your responses</div>
          ) : (
            <div className="space-y-6">
              {chapter.questions.map((question, index) => (
                <div key={question.id}>
                  <label htmlFor={question.id} className="mb-2 block font-medium text-foreground">{index + 1}. {question.prompt}</label>
                  <textarea
                    id={question.id}
                    rows={4}
                    value={responses[question.id] || ""}
                    onChange={(event) => {
                      setResponses((current) => ({ ...current, [question.id]: event.target.value }));
                      setSaved(false);
                    }}
                    placeholder="Write a few notes or tell the story in your own words..."
                    className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              ))}
            </div>
          )}

          {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={() => setChapterIndex((index) => Math.max(index - 1, 0))} disabled={chapterIndex === 0 || saving}>
              <ChevronLeft className="mr-1 h-4 w-4" /> Previous
            </Button>
            <div className="flex items-center gap-3">
              {saved && <span className="text-sm text-muted-foreground">Saved</span>}
              <Button type="button" variant="outline" onClick={() => saveResponses()} disabled={loading || saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save responses
              </Button>
              <Button type="button" onClick={async () => {
                if (await saveResponses(true)) setChapterIndex((index) => Math.min(index + 1, CHAPTERS.length - 1));
              }} disabled={loading || saving}>
                Mark complete <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
          {session.status === "completed" && (
            <p className="mt-4 text-sm text-green-700">All chapters are complete. You can still revisit and edit any response.</p>
          )}
        </CardContent>
      </Card>

      <div className="mt-4 flex justify-end">
        <Button type="button" variant="ghost" onClick={() => setChapterIndex((index) => Math.min(index + 1, CHAPTERS.length - 1))} disabled={chapterIndex === CHAPTERS.length - 1}>
          Next chapter <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </main>
  );
}