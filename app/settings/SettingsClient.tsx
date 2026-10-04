"use client";

import { FormEvent, useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useAuth } from "@/hooks/useUser";
import { useFamily } from "@/hooks/useFamily";
import { createClient } from "@/lib/supabase/client";

export function SettingsClient() {
  const { user } = useAuth();
  const { family, role } = useFamily();
  const [name, setName] = useState(user?.user_metadata?.full_name || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(user?.user_metadata?.full_name || "");
  }, [user?.id, user?.user_metadata?.full_name]);

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setSaved(false);
    setError(null);

    const { error: updateError } = await createClient().auth.updateUser({
      data: { full_name: name.trim() },
    });

    setSaving(false);
    if (updateError) {
      setError(updateError.message);
    } else {
      setSaved(true);
    }
  };

  return (
    <main className="container mx-auto max-w-3xl px-4 py-8">
      <header className="mb-8">
        <p className="text-sm font-medium text-primary-600">Your account</p>
        <h1 className="mt-1 font-display text-3xl font-bold">Settings</h1>
      </header>

      <Card>
        <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={saveProfile} className="space-y-5">
            <Input label="Display name" value={name} onChange={(event) => { setName(event.target.value); setSaved(false); }} required minLength={2} />
            <Input label="Email address" type="email" value={user?.email || ""} readOnly disabled />
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={saving || name.trim().length < 2}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save profile
              </Button>
              {saved && <span className="inline-flex items-center gap-1 text-sm text-green-700"><Check className="h-4 w-4" /> Saved</span>}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-5">
        <CardHeader><CardTitle>Family</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Family archive</p>
            <p className="mt-1 font-medium">{family?.name || "No family selected"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Your role</p>
            <p className="mt-1 font-medium capitalize">{role || "Not a member"}</p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}