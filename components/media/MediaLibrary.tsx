"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, FileText, Image as ImageIcon, Loader2, Upload, Eye, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useFamily } from "@/hooks/useFamily";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";

interface MediaItem {
  id: string;
  filename: string;
  url: string;
  thumbnail: string | null;
  size: number;
  mime_type: string;
  created_at: string;
}

interface MediaLibraryProps {
  kind: "image" | "document";
}

const formatSize = (size: number) => {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const isPreviewable = (mimeType: string) => {
  return mimeType === "application/pdf" || mimeType.startsWith("image/") || mimeType === "text/plain";
};

export function MediaLibrary({ kind }: MediaLibraryProps) {
  const { family, loading: familyLoading } = useFamily();
  console.log("[MediaLibrary] family:", family, "loading:", familyLoading);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  const [previewPage, setPreviewPage] = useState(1);

  const fetchItems = useCallback(async () => {
    if (!family) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data, error: queryError } = await supabase
      .from("media")
      .select("id, filename, url, thumbnail, size, mime_type, created_at")
      .eq("family_id", family.id)
      .eq("type", kind)
      .order("created_at", { ascending: false });

    if (queryError) {
      setError("Media could not be loaded. Please try again.");
    } else {
      setItems(data || []);
      setError(null);
    }
    setLoading(false);
  }, [family, kind]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const upload = async (file?: File) => {
    if (!file || !family) return;
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("family_id", family.id);
      formData.append("type", kind === "image" ? "image" : "document");
      const response = await fetch("/api/upload", { method: "POST", body: formData });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Upload failed");
      await fetchItems();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const openPreview = (item: MediaItem) => {
    if (isPreviewable(item.mime_type)) {
      setPreviewItem(item);
      setPreviewPage(1);
    }
  };

  const closePreview = () => {
    setPreviewItem(null);
    setPreviewPage(1);
  };

  const isImage = kind === "image";
  const acceptedTypes = isImage ? "image/jpeg,image/png,image/webp,image/gif,image/heic" : ".pdf,.doc,.docx,.txt";

  return (
    <main className="container mx-auto max-w-6xl px-4 py-8">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary-600">Family archive</p>
          <h1 className="mt-1 font-display text-3xl font-bold text-foreground">{isImage ? "Photos" : "Documents"}</h1>
          <p className="mt-2 text-muted-foreground">{isImage ? "Keep family photographs together and easy to revisit." : "Preserve important records alongside your family history."}</p>
        </div>
        <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 has-[:disabled]:opacity-60">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? "Uploading" : isImage ? "Upload photos" : "Upload documents"}
          <input
            type="file"
            accept={acceptedTypes}
            multiple={isImage}
            disabled={uploading || !family}
            className="sr-only"
            onChange={async (event) => {
              const files = Array.from(event.currentTarget.files || []);
              event.currentTarget.value = "";
              for (const file of files) await upload(file);
            }}
          />
        </label>
      </header>

      {!family && <p className="rounded-md border border-border p-4 text-sm text-muted-foreground">Join a family to view and upload its {isImage ? "photos" : "documents"}.</p>}
      {error && <p role="alert" className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading archive</div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            {isImage ? <ImageIcon className="mb-4 h-9 w-9 text-muted-foreground" /> : <FileText className="mb-4 h-9 w-9 text-muted-foreground" />}
            <h2 className="font-display text-lg font-semibold">No {isImage ? "photos" : "documents"} yet</h2>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">Uploaded {isImage ? "images" : "files"} will appear here for your family to revisit.</p>
          </CardContent>
        </Card>
      ) : isImage ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <a key={item.id} href={item.url} target="_blank" rel="noreferrer" className="group overflow-hidden rounded-md border border-border bg-card">
              <div className="aspect-square bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.thumbnail || item.url} alt={item.filename} className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]" />
              </div>
              <div className="p-3">
                <p className="truncate text-sm font-medium" title={item.filename}>{item.filename}</p>
                <p className="mt-1 text-xs text-muted-foreground">{new Date(item.created_at).toLocaleDateString()} · {formatSize(item.size)}</p>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div className="divide-y divide-border border-y border-border">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-4 py-4">
              <div className="flex min-w-0 items-center gap-3 cursor-pointer" onClick={() => openPreview(item)}>
                <FileText className="h-5 w-5 flex-none text-primary-600" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="truncate font-medium" title={item.filename}>{item.filename}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.mime_type} · {formatSize(item.size)} · {new Date(item.created_at).toLocaleDateString()}</p>
                </div>
                {isPreviewable(item.mime_type) && (
                  <Button variant="ghost" size="icon" className="ml-2">
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                download
                aria-label={`Download ${item.filename}`}
                className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-md border border-border bg-background text-foreground transition-colors hover:bg-muted"
              >
                <Download className="h-4 w-4" />
              </a>
            </div>
          ))}
        </div>
      )}

      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={closePreview}>
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-lg shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-display text-lg font-semibold truncate">{previewItem.filename}</h3>
              <div className="flex items-center gap-2">
                {previewItem.mime_type === "application/pdf" && (
                  <>
                    <Button variant="ghost" size="icon" onClick={() => setPreviewPage((p) => Math.max(1, p - 1))} disabled={previewPage <= 1}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground w-20 text-center">Page {previewPage}</span>
                    <Button variant="ghost" size="icon" onClick={() => setPreviewPage((p) => p + 1)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </>
                )}
                <Button variant="ghost" size="icon" onClick={closePreview} className="ml-2">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
              {previewItem.mime_type === "application/pdf" ? (
                <iframe
                  src={`${previewItem.url}#page=${previewPage}&zoom=100`}
                  className="w-full h-[70vh] border-0"
                  title={`Preview of ${previewItem.filename}`}
                />
              ) : previewItem.mime_type.startsWith("image/") ? (
                <img src={previewItem.url} alt={previewItem.filename} className="max-w-full max-h-[70vh] object-contain" />
              ) : previewItem.mime_type === "text/plain" ? (
                <pre className="whitespace-pre-wrap font-mono text-sm max-h-[70vh] overflow-auto">{previewItem.url}</pre>
              ) : (
                <p className="text-center text-muted-foreground py-12">Preview not available for this file type</p>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}