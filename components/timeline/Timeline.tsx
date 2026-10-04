"use client";

import { formatDate, formatRelativeTime } from "@/lib/utils";
import { TimelineEvent } from "@/types/timeline";
import { cn } from "@/lib/utils";
import { Calendar, MapPin, Clock, Tag, Eye, Image as ImageIcon, FileText } from "lucide-react";

const eventTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  birth: () => <span role="img" aria-label="birth">👶</span>,
  death: () => <span role="img" aria-label="death">⚰️</span>,
  marriage: () => <span role="img" aria-label="marriage">💒</span>,
  divorce: () => <span role="img" aria-label="divorce">💔</span>,
  graduation: () => <span role="img" aria-label="graduation">🎓</span>,
  career: () => <span role="img" aria-label="career">💼</span>,
  military: () => <span role="img" aria-label="military">🎖️</span>,
  migration: () => <span role="img" aria-label="migration">🌍</span>,
  achievement: () => <span role="img" aria-label="achievement">🏆</span>,
  historical: () => <span role="img" aria-label="historical">📜</span>,
  custom: () => <span role="img" aria-label="custom">📌</span>,
};

const eventTypeColors: Record<string, string> = {
  birth: "bg-green-100 text-green-700 border-green-200",
  death: "bg-red-100 text-red-700 border-red-200",
  marriage: "bg-pink-100 text-pink-700 border-pink-200",
  divorce: "bg-gray-100 text-gray-700 border-gray-200",
  graduation: "bg-blue-100 text-blue-700 border-blue-200",
  career: "bg-purple-100 text-purple-700 border-purple-200",
  military: "bg-orange-100 text-orange-700 border-orange-200",
  migration: "bg-cyan-100 text-cyan-700 border-cyan-200",
  achievement: "bg-yellow-100 text-yellow-700 border-yellow-200",
  historical: "bg-indigo-100 text-indigo-700 border-indigo-200",
  custom: "bg-primary-100 text-primary-700 border-primary-200",
};

interface TimelineProps {
  events: TimelineEvent[];
  onEventClick?: (event: TimelineEvent) => void;
  viewMode?: "timeline" | "list";
  compact?: boolean;
}

export function Timeline({ events, onEventClick, viewMode = "timeline", compact = false }: TimelineProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" aria-hidden="true" />
        <h3 className="font-display text-lg font-semibold text-foreground mb-2">No timeline events</h3>
        <p className="text-muted-foreground">Add events to see them on the timeline</p>
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <div className="space-y-3">
        {events.map(event => (
          <TimelineEventItem key={event.id} event={event} onClick={onEventClick} compact={compact} />
        ))}
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" aria-hidden="true" />

      <div className="space-y-6">
        {events.map((event, index) => (
          <div key={event.id} className="relative flex gap-6">
            {/* Timeline dot */}
            <div className="absolute left-4 top-3 w-4 h-4 rounded-full border-4 border-card z-10 flex-shrink-0"
              style={{ backgroundColor: eventTypeColors[event.event_type]?.replace("bg-", "").replace(" text-", "").replace(" border-", "") }} />

            {/* Event card */}
            <div className="flex-1 pl-16">
              <TimelineEventItem event={event} onClick={onEventClick} compact={compact} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface TimelineEventItemProps {
  event: TimelineEvent;
  onClick?: (event: TimelineEvent) => void;
  compact?: boolean;
}

export function TimelineEventItem({ event, onClick, compact = false }: TimelineEventItemProps) {
  const Icon = eventTypeIcons[event.event_type] || eventTypeIcons.custom;
  const colorClass = eventTypeColors[event.event_type] || eventTypeColors.custom;

  const peopleNames = event.timeline_event_people?.map(p => p.people.name).join(", ") || "";
  const hasMedia = event.timeline_event_media && event.timeline_event_media.length > 0;

  return (
    <article
      className={cn(
        "bg-card border rounded-xl transition-all hover:shadow-md",
        onClick && "cursor-pointer hover:border-primary-300",
        compact ? "p-3" : "p-4"
      )}
      onClick={() => onClick?.(event)}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick?.(event); } }}
    >
      <div className="flex items-start gap-3">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0", colorClass)}>
          <Icon className="w-5 h-5" aria-hidden="true" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-foreground">{event.title}</h3>
            <span className={cn("px-2 py-0.5 text-xs rounded-full border", colorClass)}>
              {event.event_type}
            </span>
            {event.significance !== "personal" && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground">
                {event.significance}
              </span>
            )}
          </div>

          <p className="text-sm text-muted-foreground mb-2 flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
              {formatDate(event.date)}
              {event.end_date && ` – ${formatDate(event.end_date)}`}
            </span>
            {event.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                {event.location}
              </span>
            )}
          </p>

          {event.description && !compact && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{event.description}</p>
          )}

          {peopleNames && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
              <span>People:</span>
              <span className="font-medium text-foreground">{peopleNames}</span>
            </div>
          )}

          {event.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {event.tags.slice(0, 5).map(tag => (
                <span key={tag} className="px-2 py-0.5 text-xs bg-muted rounded-full text-muted-foreground">
                  {tag}
                </span>
              ))}
              {event.tags.length > 5 && (
                <span className="px-2 py-0.5 text-xs text-muted-foreground">+{event.tags.length - 5}</span>
              )}
            </div>
          )}

          {hasMedia && !compact && (
            <div className="flex flex-wrap gap-2 mt-3">
              {event.timeline_event_media?.slice(0, 3).map((media, i) => (
                <span key={i} className="flex items-center gap-1 text-xs text-muted-foreground">
                  {media.type === "image" && <ImageIcon className="w-3 h-3" />}
                  {media.type === "document" && <FileText className="w-3 h-3" />}
                  {media.caption || `${media.type} attachment`}
                </span>
              ))}
            </div>
          )}
        </div>

        {onClick && (
          <div className="flex items-center justify-center">
            <Eye className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
          </div>
        )}
      </div>
    </article>
  );
}