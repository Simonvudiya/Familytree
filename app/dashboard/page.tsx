import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BookOpen, TreePine, Clock, Users, PenTool, Plus, Search, Sparkles, Clock as ClockIcon, Image, FileText } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";

async function getDashboardData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { user: null, stories: [], people: [], timelineEvents: [], autobiographySessions: [], documents: [], photos: [], recentActivity: [] };

  const { data: membership } = await supabase
    .from("family_members")
    .select("family_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (!membership) return { user, stories: [], people: [], timelineEvents: [], autobiographySessions: [], documents: [], photos: [], recentActivity: [] };

  const familyId = membership.family_id;

  const [
    stories,
    people,
    timelineEvents,
    autobiographySessions,
    documents,
    photos,
    recentActivity
  ] = await Promise.all([
    supabase.from("stories").select("id, title, updated_at, status, author_id").eq("family_id", familyId).order("updated_at", { ascending: false }).limit(5),
    supabase.from("people").select("id, name, birth_year, death_year, profile_image").eq("family_id", familyId).order("created_at", { ascending: false }).limit(5),
    supabase.from("timeline_events").select("id, title, date, person_id").eq("family_id", familyId).order("date", { ascending: false }).limit(5),
    supabase.from("autobiography_sessions").select("id, person_id, status, current_chapter, completed_chapters, updated_at").eq("family_id", familyId).order("updated_at", { ascending: false }).limit(5),
    supabase.from("documents").select("id, title, file_type, created_at").eq("family_id", familyId).order("created_at", { ascending: false }).limit(5),
    supabase.from("media").select("id, type, url, thumbnail, filename, created_at").eq("family_id", familyId).eq("type", "image").order("created_at", { ascending: false }).limit(5),
    supabase.from("activity_log").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
  ]);

  return { 
    user, 
    stories: stories.data || [], 
    people: people.data || [], 
    timelineEvents: timelineEvents.data || [],
    autobiographySessions: autobiographySessions.data || [],
    documents: documents.data || [],
    photos: photos.data || [],
    recentActivity: recentActivity.data || [] 
  };
}

const quickActions = [
  { icon: PenTool, label: "Write Story", href: "/stories/new", color: "bg-blue-100 text-blue-600" },
  { icon: Users, label: "Add Person", href: "/people/new", color: "bg-green-100 text-green-600" },
  { icon: ClockIcon, label: "Add Event", href: "/timeline/new", color: "bg-purple-100 text-purple-600" },
  { icon: Image, label: "Upload Photos", href: "/photos?upload=true", color: "bg-orange-100 text-orange-600" },
  { icon: FileText, label: "Scan Document", href: "/documents?upload=true", color: "bg-pink-100 text-pink-600" },
  { icon: PenTool, label: "Start Autobiography", href: "/autobiography", color: "bg-indigo-100 text-indigo-600" },
];

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Middleware handles auth; user should exist here
  if (!user) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-pulse">Loading...</div></div>;
  }

  let stories: any[] = [], people: any[] = [], timelineEvents: any[] = [], recentActivity: any[] = [];
  let autobiographySessions: any[] = [], documents: any[] = [], photos: any[] = [];

  try {
    const dashboardData = await getDashboardData();
    stories = dashboardData.stories;
    people = dashboardData.people;
    timelineEvents = dashboardData.timelineEvents;
    autobiographySessions = dashboardData.autobiographySessions;
    documents = dashboardData.documents;
    photos = dashboardData.photos;
    recentActivity = dashboardData.recentActivity;
  } catch (error) {
    console.error("Failed to load dashboard data:", error);
  }

  // Check if user has family membership
  const hasMembership = stories.length > 0 || people.length > 0 || timelineEvents.length > 0 || autobiographySessions.length > 0 || documents.length > 0 || photos.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        {!hasMembership && (
          <div className="mb-8 text-center">
            <div className="bg-muted/50 rounded-xl p-8">
              <Users className="w-12 h-12 text-primary-600 mx-auto mb-4" aria-hidden="true" />
              <h2 className="font-display text-xl font-semibold text-foreground mb-2">No Family Yet</h2>
              <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                You're not part of a family yet. Complete onboarding to create or join a family.
              </p>
              <Link href="/onboarding" className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors">
                Complete Onboarding
                <Plus className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        )}
        {/* Welcome Section */}
        <section className="mb-8">
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 sm:p-8 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold mb-2">
                  Welcome back, {user.user_metadata?.full_name?.split(" ")[0] || "Family Historian"}!
                </h1>
                <p className="text-primary-100">
                  Continue building your family's legacy. {stories.length} stories, {people.length} people, {timelineEvents.length} timeline events, {autobiographySessions.length} autobiographies, {documents.length} documents, {photos.length} photos.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/stories/new" className="px-4 py-2 bg-white/20 text-white rounded-lg font-medium hover:bg-white/30 transition-colors flex items-center gap-2">
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  New Story
                </Link>
                <Link href="/people/new" className="px-4 py-2 bg-white/10 text-white rounded-lg font-medium hover:bg-white/20 transition-colors flex items-center gap-2">
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  Add Person
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-semibold text-foreground">Quick Actions</h2>
            <Link href="/stories/new" className="text-sm text-primary-600 hover:text-primary-700 font-medium">View all</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {quickActions.map((action, index) => (
              <Link key={index} href={action.href} className="p-4 rounded-xl border border-border bg-card hover:border-primary-300 hover:shadow-md transition-all group">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${action.color}`}>
                  <action.icon className="w-5 h-5" aria-hidden="true" />
                </div>
                <p className="font-medium text-foreground group-hover:text-primary-600 transition-colors">{action.label}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Stats Grid */}
        <section className="mb-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={BookOpen} label="Stories" value={stories.length} change="+2 this week" href="/stories" />
            <StatCard icon={TreePine} label="Family Members" value={people.length} change="+1 this month" href="/people" />
            <StatCard icon={Clock} label="Timeline Events" value={timelineEvents.length} change="Updated today" href="/timeline" />
            <StatCard icon={Sparkles} label="Memories" value={24} change="3 new this week" href="/memories" />
          </div>
        </section>

        {/* Recent Activity & Recent Stories */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Stories */}
          <section className="bg-card border border-border rounded-xl">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-foreground">Recent Stories</h2>
              <Link href="/stories" className="text-sm text-primary-600 hover:text-primary-700 font-medium">View all</Link>
            </div>
            <div className="divide-y divide-border">
              {stories.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" aria-hidden="true" />
                  <p>No stories yet. Start writing your first family story!</p>
                  <Link href="/stories/new" className="mt-3 inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium">
                    Write your first story
                    <Plus className="w-4 h-4" aria-hidden="true" />
                  </Link>
                </div>
              ) : (
                stories.map((story) => (
                  <Link key={story.id} href={`/stories/${story.id}`} className="p-4 hover:bg-muted/50 transition-colors flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground truncate">{story.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        Updated {new Date(story.updated_at).toLocaleDateString()} · {story.status}
                      </p>
                    </div>
                    <Sparkles className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
                  </Link>
                ))
              )}
            </div>
          </section>

          {/* Recent Activity */}
          <section className="bg-card border border-border rounded-xl">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-foreground">Recent Activity</h2>
              <Link href="/activity" className="text-sm text-primary-600 hover:text-primary-700 font-medium">View all</Link>
            </div>
            <div className="divide-y divide-border">
              {recentActivity.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <ClockIcon className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" aria-hidden="true" />
                  <p>No recent activity</p>
                </div>
              ) : (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="p-4 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Autobiography Sessions, Documents & Photos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Recent Autobiography Sessions */}
          <section className="bg-card border border-border rounded-xl">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-foreground">Autobiographies</h2>
              <Link href="/autobiography" className="text-sm text-primary-600 hover:text-primary-700 font-medium">View all</Link>
            </div>
            <div className="divide-y divide-border">
              {autobiographySessions.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <PenTool className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" aria-hidden="true" />
                  <p>No autobiography sessions yet.</p>
                  <Link href="/autobiography" className="mt-3 inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium">
                    Start one
                    <Plus className="w-4 h-4" aria-hidden="true" />
                  </Link>
                </div>
              ) : (
                autobiographySessions.map((session) => (
                  <Link key={session.id} href={`/autobiography/${session.person_id}`} className="p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">Chapter {session.current_chapter} of 12</p>
                        <p className="text-sm text-muted-foreground">
                          {session.completed_chapters?.length || 0} chapters completed · {session.status}
                        </p>
                      </div>
                      <PenTool className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>

          {/* Recent Documents */}
          <section className="bg-card border border-border rounded-xl">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-foreground">Documents</h2>
              <Link href="/documents" className="text-sm text-primary-600 hover:text-primary-700 font-medium">View all</Link>
            </div>
            <div className="divide-y divide-border">
              {documents.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" aria-hidden="true" />
                  <p>No documents yet.</p>
                  <Link href="/documents?upload=true" className="mt-3 inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium">
                    Upload first
                    <Plus className="w-4 h-4" aria-hidden="true" />
                  </Link>
                </div>
              ) : (
                documents.map((doc) => (
                  <Link key={doc.id} href={`/documents`} className="p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-foreground truncate">{doc.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {doc.file_type} · {new Date(doc.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <FileText className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>

          {/* Recent Photos */}
          <section className="bg-card border border-border rounded-xl">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-foreground">Photos</h2>
              <Link href="/photos" className="text-sm text-primary-600 hover:text-primary-700 font-medium">View all</Link>
            </div>
            <div className="divide-y divide-border">
              {photos.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Image className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" aria-hidden="true" />
                  <p>No photos yet.</p>
                  <Link href="/photos?upload=true" className="mt-3 inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium">
                    Upload first
                    <Plus className="w-4 h-4" aria-hidden="true" />
                  </Link>
                </div>
              ) : (
                photos.map((photo) => (
                  <Link key={photo.id} href={`/photos`} className="p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-foreground truncate">{photo.filename}</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(photo.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Image className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Getting Started / Tips */}
        {stories.length === 0 && people.length === 0 && (
          <section className="mt-8 bg-muted/50 rounded-xl p-8 text-center">
            <Sparkles className="w-12 h-12 text-primary-600 mx-auto mb-4" aria-hidden="true" />
            <h2 className="font-display text-xl font-semibold text-foreground mb-2">Start Your Family History Journey</h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Begin by adding family members, writing your first story, or starting a guided autobiography for a loved one.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link href="/people/new" className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors">
                Add First Family Member
              </Link>
              <Link href="/stories/new" className="px-6 py-3 border-2 border-primary-600 text-primary-600 rounded-lg font-medium hover:bg-primary-50 transition-colors">
                Write First Story
              </Link>
              <Link href="/autobiography" className="px-6 py-3 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 transition-colors">
                Start Autobiography
              </Link>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, change, href }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number; change: string; href: string }) {
  return (
    <Link href={href} className="bg-card border border-border rounded-xl p-5 hover:border-primary-300 hover:shadow-md transition-all group">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="font-display text-3xl font-bold text-foreground mt-1">{value}</p>
          <p className="text-xs text-muted-foreground mt-1">{change}</p>
        </div>
        <div className="w-12 h-12 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center group-hover:bg-primary-600 group-hover:text-white transition-colors">
          <Icon className="w-6 h-6" aria-hidden="true" />
        </div>
      </div>
    </Link>
  );
}