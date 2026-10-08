"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";

export function OnboardingClient() {
  const router = useRouter();
  const [familyName, setFamilyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createFamily = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const { error: createError, data } = await createClient().rpc("create_family_for_current_user", {
      family_name: familyName.trim(),
    });

    if (createError) {
      if (createError.message?.includes("already belong to an active family archive")) {
        router.replace("/dashboard");
        router.refresh();
        return;
      }
      setError(createError.message);
      setLoading(false);
      return;
    }

    if (data) {
      router.replace("/dashboard");
      router.refresh();
    }
  };

  return (
    <main className="container mx-auto flex min-h-[70vh] max-w-xl items-center px-4 py-10">
      <Card className="w-full">
        <CardHeader>
          <Users className="mb-3 h-7 w-7 text-primary-600" aria-hidden="true" />
          <CardTitle>Start your family archive</CardTitle>
          <p className="text-sm text-muted-foreground">Create a family space to preserve stories and invite relatives to contribute.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={createFamily} className="space-y-4">
            <Input
              label="Family name"
              value={familyName}
              onChange={(event) => setFamilyName(event.target.value)}
              placeholder="For example, the Sambuli family"
              minLength={2}
              required
              autoComplete="organization"
            />
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={loading || familyName.trim().length < 2}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create family archive
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}