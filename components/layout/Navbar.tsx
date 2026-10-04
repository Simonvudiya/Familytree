"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, TreePine, Clock, Users, PenTool, Search, Menu, X, LogOut, User, Settings, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useUser";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Stories", href: "/stories", icon: BookOpen },
  { name: "Family Tree", href: "/tree", icon: TreePine },
  { name: "Timeline", href: "/timeline", icon: Clock },
  { name: "People", href: "/people", icon: Users },
  { name: "Autobiography", href: "/autobiography", icon: PenTool },
  { name: "Memories", href: "/memories", icon: BookOpen },
  { name: "Photos", href: "/photos", icon: BookOpen },
  { name: "Documents", href: "/documents", icon: BookOpen },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, signOut, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container mx-auto px-4" aria-label="Main navigation">
        <div className="flex h-16 items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-xl font-display font-bold text-foreground">
            <BookOpen className="w-7 h-7 text-primary-600" aria-hidden="true" />
            <span>Our Family History</span>
          </Link>

          <div className="hidden md:flex md:items-center md:gap-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-primary-50 text-primary-700"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="w-4 h-4" aria-hidden="true" />
                {item.name}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex md:items-center md:gap-4">
            <Link
              href="/search"
              className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors"
            >
              <Search className="w-4 h-4" aria-hidden="true" />
              <span>Search...</span>
            </Link>

            {loading ? (
              <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
            ) : user ? (
              <div className="relative">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-medium">
                    {user.user_metadata?.full_name?.[0] || user.email?.[0]?.toUpperCase() || "U"}
                  </div>
                </button>

                {mobileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-lg border border-border bg-card py-2 shadow-lg animate-slide-down">
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <User className="w-4 h-4" aria-hidden="true" />
                      Dashboard
                    </Link>
                    <Link
                      href="/settings"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Settings className="w-4 h-4" aria-hidden="true" />
                      Settings
                    </Link>
                    <hr className="my-2 border-border" />
                    <button
                      onClick={signOut}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-destructive hover:bg-muted"
                    >
                      <LogOut className="w-4 h-4" aria-hidden="true" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="px-4 py-2 text-sm font-medium text-foreground hover:text-primary-600">
                  Sign in
                </Link>
                <Link href="/register" className="inline-flex h-10 items-center justify-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700">
                  Get Started
                </Link>
              </div>
            )}
          </div>

          <button
            className="md:hidden p-2 rounded-lg text-foreground hover:bg-muted"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div id="mobile-menu" className="md:hidden py-4 border-t border-border animate-slide-down">
            <div className="flex flex-col gap-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    pathname === item.href
                      ? "bg-primary-50 text-primary-700"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className="w-5 h-5" aria-hidden="true" />
                  {item.name}
                </Link>
              ))}
            </div>
            <hr className="my-4 border-border" />
            {user ? (
              <div className="flex flex-col gap-2">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className="w-4 h-4" />
                  Dashboard
                </Link>
                <Link
                  href="/settings"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>
                <button
                  onClick={signOut}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-muted"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link href="/login" className="px-3 py-2 text-sm font-medium text-foreground hover:text-primary-600" onClick={() => setMobileMenuOpen(false)}>
                  Sign in
                </Link>
                <Link href="/register" className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700" onClick={() => setMobileMenuOpen(false)}>
                  Get Started
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}

import { useState } from "react";