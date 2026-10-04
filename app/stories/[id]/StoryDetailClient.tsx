"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { Story } from "@/types/story";
import { Edit, Share2, Download, BookOpen, Clock, Eye, Lock, Globe, Tag, User, Users, ArrowLeft, MoreHorizontal, Trash2, Copy, CheckCircle, Loader2 } from "lucide-react";

interface StoryDetailClientProps {
  story: Story & {
    author: { id: string; full_name: string; avatar_url?: string } | null;
    story_people: { people: { id: string; name: string; birth_date?: string; death_date?: string; profile_image?: string } }[];
    story_versions: { id: string; title: string; created_at: string; created_by: string; change_summary?: string }[];
  };
  currentUserId?: string;
}

const visibilityIcons = {
  private: Lock,
  family: Users,
  public: Globe,
};

export function StoryDetailClient({ story, currentUserId }: StoryDetailClientProps) {
  const [showVersions, setShowVersions] = useState(false);
  const [copied, setCopied] = useState(false);
  const isAuthor = story.author_id === currentUserId;

  const VisibilityIcon = visibilityIcons[story.visibility];
  const readingTime = story.reading_time || Math.ceil((story.word_count || 0) / 200);

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back navigation */}
      <Link href="/stories" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        Back to Stories
      </Link>

      {/* Story Header */}
      <article className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <h1 className="font-display text-3xl lg:text-4xl font-bold text-foreground">{story.title}</h1>
              <span className={cn(
                "px-3 py-1 text-sm rounded-full",
                story.status === "published" && "bg-green-100 text-green-700",
                story.status === "draft" && "bg-yellow-100 text-yellow-700",
                story.status === "review" && "bg-blue-100 text-blue-700",
                story.status === "archived" && "bg-gray-100 text-gray-700"
              )}>
                {story.status}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {story.author && (
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" aria-hidden="true" />
                  <span>{story.author.full_name}</span>
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" aria-hidden="true" />
                {readingTime} min read
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" aria-hidden="true" />
                {story.word_count} words
              </span>
              <span>Written {formatDate(story.created_at)}</span>
              <span className="flex items-center gap-1">
                <VisibilityIcon className="w-4 h-4" aria-hidden="true" />
                {story.visibility}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {isAuthor && (
              <>
                <Link href={`/stories/${story.id}/edit`}>
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </Link>
                <Link href={`/stories/${story.id}/history`}>
                  <Button variant="outline" size="sm">
                    <Clock className="w-4 h-4 mr-2" />
                    History
                  </Button>
                </Link>
              </>
            )}
            <Button variant="outline" size="sm" onClick={copyLink}>
              {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Download className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowVersions(!showVersions)}>
              {showVersions ? <Eye className="w-4 h-4 mr-2" /> : <Clock className="w-4 h-4 mr-2" />}
              {showVersions ? "Hide History" : "History"}
            </Button>
          </div>
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap gap-3 mb-6">
          {(story.event_year || story.event_date || story.category || story.location) && (
            <div className="w-full border-l-2 border-primary-600 pl-3 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Event described:</span>{" "}
              {[story.event_year, story.event_date && formatDate(story.event_date), story.category, story.location].filter(Boolean).join(" · ")}
            </div>
          )}
          {story.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {story.tags.map(tag => (
                <span key={tag} className="px-2 py-1 text-sm bg-muted rounded-full text-muted-foreground">
                  {tag}
                </span>
              ))}
            </div>
          )}
          <div className="text-sm text-muted-foreground">
            Updated {formatRelativeTime(story.updated_at)}
            {story.published_at && ` · Published ${formatDate(story.published_at)}`}
          </div>
        </div>

        {/* People mentioned */}
        {story.story_people && story.story_people.length > 0 && (
          <div className="mb-6 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
              <Users className="w-4 h-4" aria-hidden="true" />
              People mentioned in this story
            </div>
            <div className="flex flex-wrap gap-2">
              {story.story_people.map(({ people }) => (
                <Link
                  key={people.id}
                  href={`/people/${people.id}`}
                  className="flex items-center gap-2 px-3 py-1.5 bg-background rounded-full text-sm hover:bg-muted transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-medium">
                    {people.profile_image ? (
                      <img src={people.profile_image} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      people.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
                    )}
                  </div>
                  <span className="font-medium">{people.name}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>

      {/* Version History */}
      {showVersions && story.story_versions.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Version History ({story.story_versions.length})
              <Button variant="ghost" size="sm" onClick={() => setShowVersions(false)}>
                <Eye className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {story.story_versions.map((version, index) => (
                <div key={version.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">{version.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(version.created_at)} · {version.change_summary || "No summary"}
                    </p>
                  </div>
                  {index === 0 && (
                    <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">Current</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Story Content */}
      <div className="prose prose-lg max-w-none">
        <div dangerouslySetInnerHTML={{ __html: story.content }} />
      </div>

      {/* Footer actions */}
      <div className="mt-12 pt-8 border-t border-border flex flex-wrap gap-4">
        {isAuthor && (
          <>
            <Link href={`/stories/${story.id}/edit`}>
              <Button>
                <Edit className="w-4 h-4 mr-2" />
                Edit Story
              </Button>
            </Link>
          </>
        )}
        <Button variant="outline" onClick={handlePrint}>
          <Download className="w-4 h-4 mr-2" />
          Print / Save as PDF
        </Button>
        <Button variant="outline" onClick={copyLink}>
          {copied ? <CheckCircle className="w-4 h-4 mr-2" /> : <Share2 className="w-4 h-4 mr-2" />}
          {copied ? "Copied!" : "Share Link"}
        </Button>
      </div>
    </div>
  );
}