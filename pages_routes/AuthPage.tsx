"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { registerSchema, type RegisterInput } from "@/lib/validators";

type Mode = "login" | "register";

const AuthPage = ({ mode, callbackUrl, expired }: { mode: Mode; callbackUrl: string; expired?: boolean }) => {
  const trpc = useTRPC();
  const router = useRouter();
  const [form, setForm] = useState<RegisterInput>({ name: "", email: "", phone: "", password: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterInput, string>>>({});
  const [loading, setLoading] = useState(false);

  const register = useMutation(trpc.account.register.mutationOptions());

  const set = (k: keyof RegisterInput) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const login = async (email: string, password: string) => {
    const res = await signIn("credentials", { email, password, redirect: false });
    if (!res || res.error) {
      toast.error("Invalid email or password");
      return false;
    }
    router.replace(callbackUrl);
    router.refresh();
    return true;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "register") {
        const parsed = registerSchema.safeParse(form);
        if (!parsed.success) {
          const next: typeof errors = {};
          for (const i of parsed.error.issues) next[i.path[0] as keyof RegisterInput] ??= i.message;
          setErrors(next);
          return;
        }
        setErrors({});
        await register.mutateAsync(parsed.data);
        toast.success("Account created. Welcome!");
        await login(parsed.data.email, parsed.data.password);
      } else {
        await login(form.email, form.password);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const altHref = `${mode === "login" ? "/register" : "/login"}${
    callbackUrl !== "/" ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""
  }`;

  return (
    <div className="container-x flex justify-center py-16 lg:py-24">
      <div className="w-full max-w-md">
        <h1 className="heading-display text-center text-4xl lg:text-5xl">
          {mode === "login" ? "Welcome Back" : "Create Account"}
        </h1>
        <p className="mt-3 text-center text-sm text-muted">
          {mode === "login"
            ? "Login to checkout and track your stitching orders."
            : "Register to place orders and track them anytime."}
        </p>

        {expired && (
          <p className="mt-6 border border-amber-200 bg-amber-50 p-3 text-center text-sm text-amber-900">
            Your session has expired. Please login again to continue.
          </p>
        )}

        <form onSubmit={submit} className="mt-10 space-y-5" noValidate>
          {mode === "register" && (
            <>
              <Input label="Full name" value={form.name} onChange={set("name")} error={errors.name} autoComplete="name" />
              <Input
                label="Mobile number"
                value={form.phone}
                onChange={set("phone")}
                error={errors.phone}
                placeholder="03001234567"
                inputMode="tel"
                autoComplete="tel"
              />
            </>
          )}
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={set("email")}
            error={errors.email}
            autoComplete="email"
            required
          />
          <Input
            label="Password"
            type="password"
            value={form.password}
            onChange={set("password")}
            error={errors.password}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
          />
          <Button type="submit" size="lg" className="w-full" loading={loading}>
            {mode === "login" ? "Login" : "Create Account"}
          </Button>
        </form>

        <p className="mt-8 text-center text-sm text-muted">
          {mode === "login" ? "New here? " : "Already have an account? "}
          <Link href={altHref} className="text-foreground underline underline-offset-4">
            {mode === "login" ? "Create an account" : "Login"}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
