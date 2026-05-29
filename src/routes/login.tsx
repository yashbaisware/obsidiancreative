import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import logo from "@/assets/obsidian-logo.png";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — Obsidian Creative" }] }),
  component: LoginPage,
});

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "At least 6 characters").max(72),
});

function LoginPage() {
  const navigate = useNavigate();
  const { user, isAdmin, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendingRedirect, setPendingRedirect] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Only auto-redirect signed-in admins to the dashboard. Non-admins stay
    // on /login so they aren't bounced to / by the admin guard.
    if (loading) return;
    if (user && isAdmin) {
      navigate({ to: "/admin" });
      return;
    }
    if (pendingRedirect && user && !isAdmin) {
      setError("Unauthorized Access");
      setPendingRedirect(false);
      void supabase.auth.signOut();
    }
  }, [user, isAdmin, loading, pendingRedirect, navigate]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword(parsed.data);
      if (error) throw error;
      setPendingRedirect(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="dark min-h-screen bg-background text-foreground flex items-center justify-center px-6 py-12 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 grid-bg opacity-20 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[700px] bg-glow opacity-50 pointer-events-none -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md glass rounded-3xl p-8 sm:p-10"
      >
        <Link to="/" className="flex items-center gap-3 mb-8">
          <img src={logo} alt="" width={48} height={48} className="h-12 w-12 object-contain" />
          <div>
            <div className="font-display tracking-[0.28em] text-silver text-sm">OBSIDIAN</div>
            <div className="text-[10px] tracking-[0.4em] text-primary mt-0.5">CREATIVE</div>
          </div>
        </Link>

        <h1 className="text-3xl text-silver font-semibold">Admin Sign In</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Restricted access. Authorized administrators only.
        </p>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <div>
            <label className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-xl border border-border bg-background/60 px-4 py-3 text-sm focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40"
              placeholder="you@studio.com"
            />
          </div>
          <div>
            <label className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-xl border border-border bg-background/60 px-4 py-3 text-sm focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3.5 text-sm tracking-wide font-medium hover:glow-blue transition-all disabled:opacity-50"
          >
            {busy ? "Please wait…" : "Sign In"}
          </button>
        </form>

        <p className="mt-8 text-[11px] text-muted-foreground leading-relaxed text-center">
          Public registration is closed. Contact the site owner for access.
        </p>
      </motion.div>
    </main>
  );
}
