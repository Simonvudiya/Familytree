"use client";

import { forwardRef, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface ModalProps extends HTMLAttributes<HTMLDivElement> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
}

const Modal = forwardRef<HTMLDivElement, ModalProps>(
  ({ className, open, onOpenChange, title, description, children, ...props }, ref) => {
    if (!open) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" {...props}>
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={() => onOpenChange(false)}
          aria-hidden="true"
        />
        <div
          ref={ref}
          className={cn(
            "relative z-50 w-full max-w-lg rounded-xl bg-card p-6 shadow-xl animate-slide-up",
            className
          )}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? "modal-title" : undefined}
          aria-describedby={description ? "modal-description" : undefined}
        >
          {(title || description) && (
            <div className="mb-4">
              {title && (
                <h2 id="modal-title" className="font-display text-lg font-semibold text-foreground">
                  {title}
                </h2>
              )}
              {description && (
                <p id="modal-description" className="text-sm text-muted-foreground mt-1">
                  {description}
                </p>
              )}
            </div>
          )}
          {children}
        </div>
      </div>
    );
  }
);
Modal.displayName = "Modal";

export { Modal };