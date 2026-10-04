import Link from "next/link";
import { formatRelativeTime, formatDate } from "@/lib/utils";
import { Story } from "@/types/story";
import { Calendar, Clock, Tag, Eye, Lock, Globe } from "lucide-react";

interface StoryCardProps {
  story: Story;
  variant?: "default" | "compact" | "list";
}

const statusStyles: Record<string, string> = {
  draft: "bg-yellow-100 text-yellow-700",
  review: "bg-blue-100 text-blue-700",
  published: "bg-green-100 text-green-700",
  archived: "bg-gray-100 text-gray-700",
};

const visibilityIcons = {
  private: Lock,
  family: Eye,
  public: Globe,
};

export function StoryCard({ story, variant = "default" }: StoryCardProps) {
  const VisibilityIcon = visibilityIcons[story.visibility];
  const readingTime = story.reading_time || Math.ceil((story.word_count || 0) / 200);

  if (variant === "compact") {
    return (
      <Link
        href={`/stories/${story.id}`}
        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
      >
        <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
          <Calendar className="w-5 h-5 text-primary-600" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-foreground truncate">{story.title}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <span>{formatRelativeTime(story.updated_at)}</span>
            <VisibilityIcon className="w-3 h-3" aria-hidden="true" />
          </p>
        </div>
        <span className={cn("px-2 py-0.5 text-xs rounded-full", statusStyles[story.status])}>
          {story.status}
        </span>
      </Link>
    );
  }

  if (variant === "list") {
    return (
      <div className="border-b border-border last:border-0">
        <Link href={`/stories/${story.id}`} className="flex items-center justify-between py-4 hover:bg-muted/50 transition-colors">
          <div className="flex-1 min-w-0 pr-4">
            <h3 className="font-medium text-foreground truncate">{story.title}</h3>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{story.excerpt || story.content.slice(0, 150)}</p>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" aria-hidden="true" />
                Updated {formatRelativeTime(story.updated_at)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" aria-hidden="true" />
                {readingTime} min read
              </span>
              <span className="flex items-center gap-1">
                <VisibilityIcon className="w-3 h-3" aria-hidden="true" />
                {story.visibility}
              </span>
              {story.tags.length > 0 && (
                <span className="flex items-center gap-1">
                  <Tag className="w-3 h-3" aria-hidden="true" />
                  {story.tags.slice(0, 3).join(", ")}
                  {story.tags.length > 3 && <span>+{story.tags.length - 3}</span>}
                </span>
              )}
            </div>
          </div>
          <span className={cn("px-3 py-1 text-xs rounded-full whitespace-nowrap flex-shrink-0", statusStyles[story.status])}>
            {story.status}
          </span>
        </Link>
      </div>
    );
  }

  return (
    <article className="bg-card border border-border rounded-xl p-5 hover:border-primary-300 hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <Link href={`/stories/${story.id}`}>
            <h3 className="font-display text-lg font-semibold text-foreground hover:text-primary-600 transition-colors line-clamp-2">
              {story.title}
            </h3>
          </Link>
          <span className={cn("px-2 py-1 text-xs rounded-full flex-shrink-0", statusStyles[story.status])}>
            {story.status}
          </span>
        </div>
      </div>

      {story.excerpt && (
        <p className="text-muted-foreground text-sm mb-4 line-clamp-3">{story.excerpt}</p>
      )}

      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        {story.author && (
          <span className="flex items-center gap-1">
            <div className="w-5 h-5 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs">
              {story.author.full_name?.[0] || "U"}
            </div>
            <span>{story.author.full_name}</span>
          </span>
        )}
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" aria-hidden="true" />
          {formatDate(story.updated_at)}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" aria-hidden="true" />
          {readingTime} min
        </span>
        <span className="flex items-center gap-1">
          <VisibilityIcon className="w-3 h-3" aria-hidden="true" />
          {story.visibility}
        </span>
      </div>

      {story.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {story.tags.slice(0, 5).map((tag) => (
            <span key={tag} className="px-2 py-0.5 text-xs bg-muted rounded-full text-muted-foreground">
              {tag}
            </span>
          ))}
          {story.tags.length > 5 && (
            <span className="px-2 py-0.5 text-xs text-muted-foreground">+{story.tags.length - 5}</span>
          )}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
        <Link
          href={`/stories/${story.id}`}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
        >
          Read story
          <span aria-hidden="true">→</span>
        </Link>
        {story.published_at && (
          <span className="text-xs text-muted-foreground">
            Published {formatDate(story.published_at)}
          </span>
        )}
      </div>
    </article>
  );
}

import { cn } from "@/lib/utils";