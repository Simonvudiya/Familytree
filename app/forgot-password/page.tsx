"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Loader2, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const { error: resetError } = await createClient().auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/reset-password")}`,
    });
    setLoading(false);
    if (resetError) setError(resetError.message);
    else setSent(true);
  };

  return (
    <main className="container mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <Link href="/login" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to sign in
      </Link>
      <div className="mb-6">
        <Mail className="mb-4 h-8 w-8 text-primary-600" aria-hidden="true" />
        <h1 className="font-display text-3xl font-bold">Reset your password</h1>
        <p className="mt-2 text-muted-foreground">We&apos;ll send a secure link to the email address on your account.</p>
      </div>
      {sent ? (
        <div role="status" className="flex items-start gap-3 rounded-md border border-border bg-card p-4">
          <CheckCircle className="mt-0.5 h-5 w-5 flex-none text-green-700" aria-hidden="true" />
          <p className="text-sm">If an account exists for that address, a password reset link is on its way.</p>
        </div>
      ) : (
        <form onSubmit={requestReset} className="space-y-4">
          <Input label="Email address" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading || !email.trim()} className="w-full">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send reset link
          </Button>
        </form>
      )}
    </main>
  );
}