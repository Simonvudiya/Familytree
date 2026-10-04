"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { BookOpen, Lock, User, AlertCircle, CheckCircle, Loader2 } from "lucide-react";

export default function InvitePage() {
  return (
    <Suspense fallback={<div className="min-h-screen" aria-busy="true" />}>
      <InviteForm />
    </Suspense>
  );
}

function InviteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [step, setStep] = useState<"verify" | "register" | "success">("verify");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailConfirmationPending, setEmailConfirmationPending] = useState(false);
  const [joined, setJoined] = useState(false);
  const [inviteData, setInviteData] = useState<{ familyName: string; role: string; inviterName: string } | null>(null);

  useEffect(() => {
    if (token) {
      verifyToken();
    } else {
      setLoading(false);
      setError("Invitation token is missing");
    }
  }, [token]);

  const verifyToken = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("get_family_invitation", { invitation_token: token });

      const invitation = data?.[0];
      if (error || !invitation) {
        setError("Invalid or expired invitation link");
        return;
      }

      setInviteData({
        familyName: invitation.family_name,
        role: invitation.role,
        inviterName: invitation.inviter_name,
      });
      setEmail(invitation.email);

      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.email?.toLowerCase() === invitation.email.toLowerCase()) {
        const { error: acceptError } = await supabase.rpc("accept_family_invitation", { invitation_token: token });
        if (acceptError) throw acceptError;
        setJoined(true);
        setStep("success");
        return;
      }
      setStep("register");
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : "Failed to verify invitation");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(`/invite?token=${token}`)}`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      const { error: acceptError } = await supabase.rpc("accept_family_invitation", { invitation_token: token });
      if (acceptError) {
        setError(acceptError.message);
        setLoading(false);
        return;
      }
      setJoined(true);
    } else {
      setEmailConfirmationPending(true);
    }

    setStep("success");
    setLoading(false);
  };

  if (step === "verify") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary-50 to-background px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center gap-2 text-2xl font-display font-bold text-foreground mb-6">
            <BookOpen className="w-8 h-8 text-primary-600" aria-hidden="true" />
            <span>Our Family History</span>
          </div>
          {loading ? (
            <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
              <Loader2 className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-4" aria-hidden="true" />
              <p className="text-muted-foreground">Verifying your invitation...</p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
              <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" aria-hidden="true" />
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">Invalid Invitation</h1>
              <p className="text-muted-foreground mb-6">{error || "This invitation link is invalid or has expired."}</p>
              <button
                onClick={() => router.push("/login")}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
              >
                Go to Login
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary-50 to-background px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center gap-2 text-2xl font-display font-bold text-foreground mb-6">
            <BookOpen className="w-8 h-8 text-primary-600" aria-hidden="true" />
            <span>Our Family History</span>
          </div>
          <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" aria-hidden="true" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground mb-2">Welcome to the Family!</h1>
            <p className="text-muted-foreground mb-6">
              {emailConfirmationPending
                ? <>Confirm your email using the link we sent. You&apos;ll then join <strong>{inviteData?.familyName}</strong> automatically.</>
                : joined
                  ? <>You&apos;ve joined <strong>{inviteData?.familyName}</strong> as a <strong>{inviteData?.role}</strong>.</>
                  : <>Your invitation is ready.</>}
            </p>
            <button
              onClick={() => router.push(emailConfirmationPending ? "/login" : "/dashboard")}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              {emailConfirmationPending ? "Go to Sign In" : "Go to Dashboard"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary-50 to-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-2xl font-display font-bold text-foreground mb-6">
            <BookOpen className="w-8 h-8 text-primary-600" aria-hidden="true" />
            <span>Our Family History</span>
          </Link>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">Join {inviteData?.familyName}</h1>
          <p className="text-muted-foreground">
            Invited by {inviteData?.inviterName} as a {inviteData?.role}
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 sm:p-8 shadow-sm">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg mb-6" role="alert">
              <AlertCircle className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            <input type="hidden" name="email" value={email} />

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1.5">
                Your Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" aria-hidden="true" />
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="Your full name"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1.5">
                Create Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" aria-hidden="true" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full pl-10 pr-4 py-3 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary-600 text-white rounded-lg font-semibold text-base hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" aria-hidden="true" /> : "Join Family"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href={`/login?redirectTo=${encodeURIComponent(`/invite?token=${token}`)}`} className="text-primary-600 hover:text-primary-700 font-medium">
              Sign in instead
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}