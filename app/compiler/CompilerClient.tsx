"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, BookOpen, FileText, Download, Loader2, Settings, Eye, Edit, Trash2, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";
import { useFamily } from "@/hooks/useFamily";
import { cn } from "@/lib/utils";

interface Chapter {
  id: string;
  title: string;
  description: string | null;
  order_index: number;
  status: "planned" | "writing" | "review" | "finalized";
  word_count: number;
  stories: string[];
  created_at: string;
  updated_at: string;
}

interface Book {
  id: string;
  title: string;
  subtitle: string | null;
  cover_image: string | null;
  status: "draft" | "compiling" | "ready" | "published";
  format: "pdf" | "docx" | "epub" | "print";
  chapter_ids: string[];
  settings: Record<string, unknown>;
  generated_url: string | null;
  created_at: string;
  updated_at: string;
}

interface Story {
  id: string;
  title: string;
  status: string;
  word_count: number;
}

export function CompilerClient() {
  const { family } = useFamily();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"chapters" | "books" | "stories">("chapters");
  const [creatingChapter, setCreatingChapter] = useState(false);
  const [creatingBook, setCreatingBook] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [newBookTitle, setNewBookTitle] = useState("");

  const fetchData = async () => {
    if (!family) return;
    setLoading(true);

    try {
      const supabase = createClient();

      const [chaptersRes, booksRes, storiesRes] = await Promise.all([
        supabase.from("chapters").select("*").eq("family_id", family.id).order("order_index"),
        supabase.from("books").select("*").eq("family_id", family.id).order("updated_at", { ascending: false }),
        supabase.from("stories").select("id, title, status, word_count").eq("family_id", family.id).eq("status", "published").order("title"),
      ]);

      if (chaptersRes.error) throw chaptersRes.error;
      if (booksRes.error) throw booksRes.error;
      if (storiesRes.error) throw storiesRes.error;

      setChapters(chaptersRes.data || []);
      setBooks(booksRes.data || []);
      setStories(storiesRes.data || []);
    } catch (error) {
      console.error("Failed to load compiler data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [family]);

  const createChapter = async () => {
    if (!newChapterTitle.trim() || !family) return;
    setCreatingChapter(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const maxOrder = chapters.length > 0 ? Math.max(...chapters.map(c => c.order_index)) : 0;

      const { error } = await supabase.from("chapters").insert({
        family_id: family.id,
        created_by: user?.id,
        title: newChapterTitle,
        order_index: maxOrder + 1,
        status: "planned",
        stories: [],
      });

      if (error) throw error;
      setNewChapterTitle("");
      fetchData();
    } catch (error) {
      console.error("Failed to create chapter:", error);
    } finally {
      setCreatingChapter(false);
    }
  };

  const createBook = async () => {
    if (!newBookTitle.trim() || !family) return;
    setCreatingBook(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.from("books").insert({
        family_id: family.id,
        created_by: user?.id,
        title: newBookTitle,
        status: "draft",
        format: "pdf",
        chapter_ids: chapters.map(c => c.id),
      });

      if (error) throw error;
      setNewBookTitle("");
      fetchData();
    } catch (error) {
      console.error("Failed to create book:", error);
    } finally {
      setCreatingBook(false);
    }
  };

  const updateChapterOrder = async (chapterId: string, newIndex: number) => {
    const supabase = createClient();
    const updatedChapters = [...chapters];
    const chapterIndex = updatedChapters.findIndex(c => c.id === chapterId);
    const [chapter] = updatedChapters.splice(chapterIndex, 1);
    updatedChapters.splice(newIndex, 0, chapter);

    const updates = updatedChapters.map((c, i) => ({ id: c.id, order_index: i }));
    const { error } = await supabase.from("chapters").upsert(updates);
    if (!error) fetchData();
  };

  const deleteChapter = async (id: string) => {
    if (!confirm("Delete this chapter?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("chapters").delete().eq("id", id);
    if (!error) fetchData();
  };

  const deleteBook = async (id: string) => {
    if (!confirm("Delete this book?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("books").delete().eq("id", id);
    if (!error) fetchData();
  };

  const compileBook = async (bookId: string) => {
    const supabase = createClient();
    const { error } = await supabase.from("books").update({ status: "compiling" }).eq("id", bookId);
    if (error) return;

    // In production, this would trigger a serverless function or background job
    // For now, simulate compilation
    setTimeout(async () => {
      await supabase.from("books").update({
        status: "ready",
        generated_url: "/generated/book.pdf", // placeholder
      }).eq("id", bookId);
      fetchData();
    }, 3000);
  };

  const statusStyles: Record<string, string> = {
    planned: "bg-gray-100 text-gray-700",
    writing: "bg-blue-100 text-blue-700",
    review: "bg-yellow-100 text-yellow-700",
    finalized: "bg-green-100 text-green-700",
  };

  const bookStatusStyles: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700",
    compiling: "bg-blue-100 text-blue-700",
    ready: "bg-green-100 text-green-700",
    published: "bg-purple-100 text-purple-700",
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground">Book Compiler</h1>
        <p className="text-muted-foreground mt-1">Organize stories into chapters and compile your family history book</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-border mb-6">
        <nav className="flex gap-1" role="tablist">
          {[
            { id: "chapters", label: "Chapters", icon: FileText },
            { id: "stories", label: "Available Stories", icon: BookOpen },
            { id: "books", label: "Books", icon: Download },
          ].map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={cn(
                "px-4 py-3 text-sm font-medium rounded-t-lg transition-colors border-b-2 -mb-px flex items-center gap-2",
                activeTab === tab.id
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <tab.icon className="w-4 h-4" aria-hidden="true" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Chapters Tab */}
      {activeTab === "chapters" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-semibold text-foreground">Chapters</h2>
              <p className="text-muted-foreground text-sm">Drag to reorder chapters</p>
            </div>
            <div className="flex gap-2">
              <Input
                value={newChapterTitle}
                onChange={(e) => setNewChapterTitle(e.target.value)}
                placeholder="New chapter title..."
                className="w-64"
              />
              <Button onClick={createChapter} disabled={creatingChapter || !newChapterTitle.trim()}>
                {creatingChapter ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}Add
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="h-6 bg-muted rounded w-1/3" />
                      <div className="h-5 bg-muted rounded w-20" />
                    </div>
                </CardContent>
              </Card>
            ))}
          </div>
          ) : chapters.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" aria-hidden="true" />
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">No chapters yet</h3>
                <p className="text-muted-foreground mb-4">Create your first chapter to start organizing your book</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {chapters.map((chapter, index) => (
                <Card key={chapter.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-4">
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" aria-label="Drag to reorder">
                        <ArrowUpDown className="w-5 h-5" />
                      </Button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-foreground">{chapter.title}</h3>
                          <span className={cn("px-2 py-0.5 text-xs rounded-full", statusStyles[chapter.status])}>
                            {chapter.status}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {chapter.word_count} words · {chapter.stories?.length || 0} stories
                        </p>
                        {chapter.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{chapter.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Link href={`/compiler/chapters/${chapter.id}`}>
                          <Button variant="ghost" size="icon" aria-label="Edit chapter">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="icon" onClick={() => deleteChapter(chapter.id)} aria-label="Delete chapter">
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stories Tab */}
      {activeTab === "stories" && (
        <div>
          <div className="mb-6">
            <h2 className="font-display text-xl font-semibold text-foreground">Published Stories</h2>
            <p className="text-muted-foreground text-sm">Select stories to include in your chapters</p>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="pt-4">
                    <div className="h-6 bg-muted rounded w-1/3" />
                    </CardContent>
                  </Card>
              ))}
            </div>
          ) : stories.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" aria-hidden="true" />
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">No published stories</h3>
                <p className="text-muted-foreground mb-4">Publish stories first to include them in your book</p>
                <Link href="/stories/new">
                  <Button>Write a Story</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {stories.map((story) => (
                <Card key={story.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-4">
                    <h3 className="font-medium text-foreground">{story.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{story.word_count} words</p>
                    <div className="flex items-center gap-2 mt-3">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Plus className="w-4 h-4 mr-1" /> Add to Chapter
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Books Tab */}
      {activeTab === "books" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-semibold text-foreground">Compiled Books</h2>
              <p className="text-muted-foreground text-sm">Generate and download your family history books</p>
            </div>
            <div className="flex gap-2">
              <Input
                value={newBookTitle}
                onChange={(e) => setNewBookTitle(e.target.value)}
                placeholder="Book title..."
                className="w-64"
              />
              <Button onClick={createBook} disabled={creatingBook || !newBookTitle.trim()}>
                {creatingBook ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}Create Book
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="pt-6">
                    <div className="h-6 bg-muted rounded w-1/3 mb-4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : books.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Download className="w-12 h-12 text-muted-foreground mx-auto mb-4" aria-hidden="true" />
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">No books compiled yet</h3>
                <p className="text-muted-foreground mb-4">Create a book and add chapters to compile your family history</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {books.map((book) => (
                <Card key={book.id} className="hover:shadow-md transition-shadow">
                  {book.cover_image && (
                    <div className="h-40 relative">
                      <img src={book.cover_image} alt="" className="w-full h-full object-cover" />
                      <div className="absolute top-3 right-3">
                        <span className={cn("px-2 py-1 text-xs rounded-full", bookStatusStyles[book.status])}>
                          {book.status}
                        </span>
                      </div>
                    </div>
                  )}
                  <CardContent className="pt-4">
                    {!book.cover_image && (
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-display text-lg font-semibold text-foreground">{book.title}</h3>
                        <span className={cn("px-2 py-1 text-xs rounded-full", bookStatusStyles[book.status])}>
                          {book.status}
                        </span>
                      </div>
                    )}
                    {book.subtitle && <p className="text-muted-foreground text-sm mb-3">{book.subtitle}</p>}
                    <p className="text-sm text-muted-foreground mb-4">
                      {book.chapter_ids?.length || 0} chapters · {book.format.toUpperCase()}
                    </p>
                    <div className="flex gap-2">
                      {book.status === "ready" && book.generated_url && (
                        <a href={book.generated_url} download className="flex-1">
                          <Button variant="outline" className="w-full">
                            <Download className="w-4 h-4 mr-2" /> Download
                          </Button>
                        </a>
                      )}
                      {book.status !== "ready" && (
                        <Button variant="outline" className="flex-1" onClick={() => compileBook(book.id)}>
                          <Loader2 className="w-4 h-4 mr-2" /> Compile
                        </Button>
                      )}
                      <Link href={`/compiler/book/${book.id}`}>
                        <Button variant="ghost" size="icon" aria-label="Configure book">
                          <Settings className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="icon" onClick={() => deleteBook(book.id)} aria-label="Delete book">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}