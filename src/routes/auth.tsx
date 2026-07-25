import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Nagaram AI Hyderabad" },
      {
        name: "description",
        content: "Sign in to save your Nagaram AI conversations and track your GHMC and HMWSSB civic complaints.",
      },
      { property: "og:title", content: "Sign in — Nagaram AI Hyderabad" },
      { property: "og:description", content: "Save conversations and track civic complaints." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { lang } = useLang();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/assistant" });
  }, [user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: name },
          },
        });
        if (error) throw error;
        toast.success(lang === "te" ? "ఖాతా సృష్టించబడింది" : "Account created");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error(result.error.message ?? "Google sign-in failed");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/assistant" });
  };

  return (
    <SiteShell>
      <div className="mx-auto flex min-h-[80vh] max-w-md items-center px-4 py-16">
        <div className="glass-panel w-full rounded-3xl p-8 animate-rise-in">
          <h1 className="text-2xl font-bold">
            {mode === "signin"
              ? lang === "te"
                ? "సైన్ ఇన్ చేయండి"
                : "Welcome back"
              : lang === "te"
                ? "ఖాతా సృష్టించండి"
                : "Create your account"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {lang === "te"
              ? "మీ సంభాషణలు మరియు ఫిర్యాదులను సేవ్ చేయడానికి."
              : "To save your conversations and track civic complaints."}
          </p>

          <Button variant="outline" className="mt-6 w-full" onClick={google} type="button">
            {lang === "te" ? "Google తో కొనసాగండి" : "Continue with Google"}
          </Button>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            {lang === "te" ? "లేదా" : "or"}
            <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <Label htmlFor="name">{lang === "te" ? "పేరు" : "Name"}</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" />
              </div>
            )}
            <div>
              <Label htmlFor="email">{lang === "te" ? "ఇమెయిల్" : "Email"}</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="password">{lang === "te" ? "పాస్‌వర్డ్" : "Password"}</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {mode === "signin"
                ? lang === "te"
                  ? "సైన్ ఇన్"
                  : "Sign in"
                : lang === "te"
                  ? "ఖాతా సృష్టించు"
                  : "Sign up"}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="mt-5 w-full text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            {mode === "signin"
              ? lang === "te"
                ? "కొత్త వారా? ఖాతా సృష్టించండి"
                : "New here? Create an account"
              : lang === "te"
                ? "ఇప్పటికే ఖాతా ఉందా? సైన్ ఇన్"
                : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </SiteShell>
  );
}