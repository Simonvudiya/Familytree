"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Bold, Italic, Strikethrough, Code, Heading1, Heading2, Heading3, List, ListOrdered, Quote, Undo, Redo, Link as LinkIcon, Image as ImageIcon, Save, Eye, Maximize2 } from "lucide-react";

interface StoryEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  autosave?: boolean;
}

const TOOLBAR_BUTTONS = [
  { id: "bold", icon: Bold, format: "bold", title: "Bold (Ctrl+B)" },
  { id: "italic", icon: Italic, format: "italic", title: "Italic (Ctrl+I)" },
  { id: "strikethrough", icon: Strikethrough, format: "strikethrough", title: "Strikethrough" },
  { id: "code", icon: Code, format: "code", title: "Inline Code" },
  { type: "separator" },
  { id: "h1", icon: Heading1, format: "heading", value: "h1", title: "Heading 1" },
  { id: "h2", icon: Heading2, format: "heading", value: "h2", title: "Heading 2" },
  { id: "h3", icon: Heading3, format: "heading", value: "h3", title: "Heading 3" },
  { type: "separator" },
  { id: "ul", icon: List, format: "insertUnorderedList", title: "Bullet List" },
  { id: "ol", icon: ListOrdered, format: "insertOrderedList", title: "Numbered List" },
  { id: "quote", icon: Quote, format: "formatBlock", value: "blockquote", title: "Quote" },
  { type: "separator" },
  { id: "link", icon: LinkIcon, format: "createLink", title: "Add Link" },
  { id: "image", icon: ImageIcon, format: "insertImage", title: "Add Image" },
  { type: "separator" },
  { id: "undo", icon: Undo, format: "undo", title: "Undo (Ctrl+Z)" },
  { id: "redo", icon: Redo, format: "redo", title: "Redo (Ctrl+Y)" },
];

export function StoryEditor({
  value,
  onChange,
  placeholder = "Write your story here...",
  readOnly = false,
  autosave = false,
}: StoryEditorProps) {
  const [isEditing, setIsEditing] = useState(true);
  const [wordCount, setWordCount] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
  const editorRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastSavedRef = useRef<string>(value);

  useEffect(() => {
    const words = value.trim().split(/\s+/).filter(Boolean).length;
    setWordCount(words);
    setReadingTime(Math.ceil(words / 200));
  }, [value]);

  useEffect(() => {
    if (autosave && value !== lastSavedRef.current) {
      const timeout = setTimeout(() => {
        lastSavedRef.current = value;
        // Autosave would trigger here
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [value, autosave]);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const html = target.innerHTML;
    onChange(html);
  };

  const executeFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    onChange(editorRef.current?.innerHTML || "");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "b") {
      e.preventDefault();
      executeFormat("bold");
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "i") {
      e.preventDefault();
      executeFormat("italic");
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "z") {
      e.preventDefault();
      if (e.shiftKey) executeFormat("redo");
      else executeFormat("undo");
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "y") {
      e.preventDefault();
      executeFormat("redo");
    }
  };

  const toggleView = () => {
    setIsEditing(!isEditing);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
    onChange(editorRef.current?.innerHTML || "");
  };

  if (readOnly) {
    return (
      <div
        className="prose max-w-none p-4 min-h-[300px] bg-background border border-border rounded-lg"
        dangerouslySetInnerHTML={{ __html: value }}
      />
    );
  }

  return (
    <div className="border border-border rounded-lg bg-background overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-border bg-muted/50">
        {TOOLBAR_BUTTONS.map((button, index) => {
          if (button.type === "separator") {
            return <div key={`sep-${index}`} className="w-px h-6 bg-border mx-1" />;
          }
          if (!("icon" in button) || !button.icon) return null;
          const Icon = button.icon;
          return (
            <Button
              key={button.id}
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                if (button.format === "createLink") {
                  const url = prompt("Enter URL:");
                  if (url) executeFormat(button.format, url);
                } else if (button.format === "insertImage") {
                  const url = prompt("Enter image URL:");
                  if (url) executeFormat(button.format, url);
                } else if (button.format === "heading") {
                  executeFormat("formatBlock", button.value);
                } else if (button.format === "formatBlock") {
                  executeFormat("formatBlock", button.value);
                } else if (button.format) {
                  executeFormat(button.format);
                }
              }}
              disabled={readOnly}
              title={button.title}
              aria-label={button.title}
            >
              <Icon className="w-4 h-4" aria-hidden="true" />
            </Button>
          );
        })}
        <div className="flex-1" />
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{wordCount} words</span>
          <span>·</span>
          <span>{readingTime} min read</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleView}
          aria-label={isEditing ? "Preview" : "Edit"}
          title={isEditing ? "Preview" : "Edit"}
        >
          {isEditing ? <Eye className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </Button>
      </div>

      {/* Editor */}
      {isEditing ? (
        <div
          ref={editorRef}
          role="textbox"
          aria-multiline="true"
          aria-label={placeholder}
          contentEditable
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          className="prose max-w-none p-4 min-h-[300px] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset"
          data-placeholder={placeholder}
          dangerouslySetInnerHTML={{ __html: value || "" }}
          spellCheck
        />
      ) : (
        <div
          className="prose max-w-none p-4 min-h-[300px] bg-muted/30 border-t border-border"
          dangerouslySetInnerHTML={{ __html: value }}
        />
      )}
    </div>
  );
}