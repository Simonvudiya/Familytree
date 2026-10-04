"use client";

import { formatDate, formatRelativeTime } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { ArrowLeft, Clock, Eye, Copy, CheckCircle, Loader2, RotateCcw } from "lucide-react";

interface StoryHistoryClientProps {
  story: {
    id: string;
    title: string;
    content: string;
    updated_at: string;
    story_versions: {
      id: string;
      title: string;
      content: string;
      created_at: string;
      created_by: string;
      change_summary?: string;
    }[];
  };
}

export function StoryHistoryClient({ story }: StoryHistoryClientProps) {
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [restoring, setRestoring] = useState<string | null>(null);

  const copyContent = async (content: string, versionId: string) => {
    await navigator.clipboard.writeText(content);
    setCopied(versionId);
    setTimeout(() => setCopied(null), 2000);
  };

  const restoreVersion = async (versionId: string) => {
    if (!confirm("Restore this version? This will create a new version with the restored content.")) return;
    
    setRestoring(versionId);
    // In production, this would call an API route to restore
    // For now, just navigate back
    setTimeout(() => {
      setRestoring(null);
      alert("Version restored! (This would call the API in production)");
    }, 1000);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6 flex items-center gap-4">
        <Link href={`/stories/${story.id}`}>
          <Button variant="ghost" size="icon" aria-label="Back to story">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Version History</h1>
          <p className="text-muted-foreground">{story.title} · {story.story_versions.length} versions</p>
        </div>
      </div>

      {/* Current version */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Current Version</CardTitle>
          <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">Live</span>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground">
              Last updated {formatRelativeTime(story.updated_at)}
            </p>
          </div>
          <div className="prose max-w-none p-4 bg-muted/50 rounded-lg border border-border max-h-64 overflow-y-auto">
            <div dangerouslySetInnerHTML={{ __html: story.content }} />
          </div>
        </CardContent>
      </Card>

      {/* Version history */}
      <Card>
        <CardHeader>
          <CardTitle>Previous Versions ({story.story_versions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {story.story_versions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-4" aria-hidden="true" />
              <p>No previous versions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {story.story_versions.map((version, index) => (
                <div
                  key={version.id}
                  className={cn(
                    "p-4 border rounded-lg transition-colors",
                    selectedVersion === version.id ? "border-primary-300 bg-primary-50" : "border-border hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-foreground">{version.title}</h4>
                        {version.change_summary && (
                          <span className="px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded-full">
                            {version.change_summary}
                          </span>
                        )}
                        {index === 0 && (
                          <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">Previous</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(version.created_at)} · {formatRelativeTime(version.created_at)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedVersion(selectedVersion === version.id ? null : version.id)}
                        aria-label={selectedVersion === version.id ? "Hide version" : "View version"}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyContent(version.content, version.id)}
                        disabled={copied === version.id}
                      >
                        {copied === version.id ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => restoreVersion(version.id)}
                        disabled={restoring === version.id}
                      >
                        {restoring === version.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  {selectedVersion === version.id && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="prose max-w-none p-4 bg-muted/50 rounded-lg border border-border max-h-96 overflow-y-auto">
                        <div dangerouslySetInnerHTML={{ __html: version.content }} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { useState } from "react";