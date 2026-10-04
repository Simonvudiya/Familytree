"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Loader2, LockKeyhole } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function ResetPasswordClient() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updatePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password !== confirmation) {
      setError("The passwords do not match.");
      return;
    }
    setLoading(true);
    setError(null);
    const { error: updateError } = await createClient().auth.updateUser({ password });
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setComplete(true);
  };

  return (
    <main className="container mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-10">
      <LockKeyhole className="mb-4 h-8 w-8 text-primary-600" aria-hidden="true" />
      <h1 className="font-display text-3xl font-bold">Choose a new password</h1>
      <p className="mb-6 mt-2 text-muted-foreground">Use at least eight characters.</p>
      {complete ? (
        <div className="space-y-4">
          <p role="status" className="flex items-center gap-2 text-sm text-green-700"><CheckCircle className="h-5 w-5" /> Password updated.</p>
          <Button type="button" onClick={() => router.replace("/login")}>Return to sign in</Button>
        </div>
      ) : (
        <form onSubmit={updatePassword} className="space-y-4">
          <Input label="New password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" minLength={8} required />
          <Input label="Confirm new password" type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" minLength={8} required />
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading || password.length < 8 || confirmation.length < 8}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update password
          </Button>
        </form>
      )}
    </main>
  );
}