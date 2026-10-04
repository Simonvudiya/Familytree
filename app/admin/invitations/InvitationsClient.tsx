"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Copy, Loader2, MailPlus } from "lucide-react";
import { useFamily } from "@/hooks/useFamily";
import { Invitation, UserRole } from "@/types/family";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";

export function InvitationsClient() {
  const { family, role, can, inviteMember } = useFamily();
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("contributor");
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [inviteUrl, setInviteUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInvitations = useCallback(async () => {
    if (!family) {
      setLoading(false);
      return;
    }
    const { data, error: queryError } = await createClient()
      .from("invitations")
      .select("*")
      .eq("family_id", family.id)
      .order("created_at", { ascending: false });
    if (queryError) setError(queryError.message);
    else setInvitations(data || []);
    setLoading(false);
  }, [family]);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  const sendInvitation = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSending(true);
    setError(null);
    setInviteUrl("");
    try {
      const invitation = await inviteMember(email.trim(), inviteRole);
      setInviteUrl(`${window.location.origin}/invite?token=${invitation.token}`);
      setEmail("");
      await fetchInvitations();
    } catch (inviteError) {
      setError(inviteError instanceof Error ? inviteError.message : "Invitation could not be created.");
    } finally {
      setSending(false);
    }
  };

  const copyInvite = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  if (!can(["admin"])) {
    return <main className="container mx-auto max-w-4xl px-4 py-10"><p role="alert">Only family administrators can manage invitations.</p></main>;
  }

  return (
    <main className="container mx-auto max-w-4xl px-4 py-8">
      <header className="mb-8">
        <p className="text-sm font-medium text-primary-600">{family?.name || "Family archive"}</p>
        <h1 className="mt-1 font-display text-3xl font-bold">Family invitations</h1>
        <p className="mt-2 text-muted-foreground">Invite relatives by email. Membership becomes active only after they verify the invited address.</p>
      </header>

      <Card>
        <CardHeader><CardTitle>Invite a family member</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={sendInvitation} className="grid gap-4 sm:grid-cols-[1fr_12rem_auto] sm:items-end">
            <Input label="Email address" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            <Select
              label="Initial role"
              value={inviteRole}
              onChange={(event) => setInviteRole(event.target.value as UserRole)}
              options={[
                { value: "contributor", label: "Contributor" },
                { value: "viewer", label: "Viewer" },
                { value: "editor", label: "Editor" },
                ...(role === "owner" ? [{ value: "admin", label: "Administrator" }] : []),
              ]}
            />
            <Button type="submit" disabled={sending || !family}>
              {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MailPlus className="mr-2 h-4 w-4" />}
              Create invite
            </Button>
          </form>
          {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
          {inviteUrl && (
            <div className="mt-5 flex flex-col gap-3 rounded-md border border-border bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="min-w-0 break-all text-sm text-foreground">{inviteUrl}</p>
              <Button type="button" variant="outline" onClick={copyInvite}>
                {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                {copied ? "Copied" : "Copy invitation link"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <section className="mt-8">
        <h2 className="mb-3 font-display text-xl font-semibold">Recent invitations</h2>
        {loading ? (
          <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading invitations</div>
        ) : invitations.length === 0 ? (
          <p className="border-y border-border py-8 text-center text-sm text-muted-foreground">No invitations yet.</p>
        ) : (
          <div className="divide-y divide-border border-y border-border">
            {invitations.map((invitation) => (
              <div key={invitation.id} className="flex flex-wrap items-center justify-between gap-2 py-4">
                <div>
                  <p className="font-medium">{invitation.email}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{invitation.role} · Expires {new Date(invitation.expires_at).toLocaleDateString()}</p>
                </div>
                <span className={`text-sm capitalize ${invitation.status === "accepted" ? "text-green-700" : "text-muted-foreground"}`}>{invitation.status}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}