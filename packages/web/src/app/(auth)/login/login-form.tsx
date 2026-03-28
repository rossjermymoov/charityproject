"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Signing in..." : "Sign In"}
    </Button>
  );
}

interface LoginFormProps {
  action: (formData: FormData) => Promise<{ error: string } | undefined>;
}

export function LoginForm({ action }: LoginFormProps) {
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);
    const result = await action(formData);
    if (result?.error) {
      setError(result.error);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}
          <Input
            label="Email"
            name="email"
            type="email"
            placeholder="admin@charity.org"
            required
          />
          <Input
            label="Password"
            name="password"
            type="password"
            placeholder="Enter your password"
            required
          />
          <SubmitButton />
          <p className="text-xs text-center text-gray-400 mt-4">
            Demo: admin@charity.org / password
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
