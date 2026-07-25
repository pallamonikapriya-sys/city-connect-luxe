import { Link, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Menu, X, LogOut } from "lucide-react";
import { useLang, LANG_NAME } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import mark from "@/assets/nagaram-mark.png";

const NAV = [
  { to: "/", key: "navHome" },
  { to: "/places", key: "navPlaces" },
  { to: "/travel", key: "navTravel" },
  { to: "/assistant", key: "navAssistant" },
  { to: "/report", key: "navReport" },
] as const;

export function SiteShell({ children }: { children: ReactNode }) {
  const { t, lang, setLang } = useLang();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  return (
    <div lang={lang} className="relative min-h-screen">
      <div className="pointer-events-none fixed inset-0 city-grid opacity-40" aria-hidden />
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={mark} alt="" className="h-9 w-9 animate-float-slow" />
            <span className="font-display text-lg font-semibold tracking-tight">{t("brand")}</span>
          </Link>

          <nav className="ml-6 hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-full px-3.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground [&.active]:bg-accent [&.active]:text-foreground"
                activeOptions={{ exact: item.to === "/" }}
              >
                {t(item.key)}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <div className="flex rounded-full border border-border/70 p-0.5">
              {(["en", "te"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  aria-pressed={lang === l}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    lang === l
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {LANG_NAME[l]}
                </button>
              ))}
            </div>

            {user ? (
              <>
                <Link to="/complaints" className="hidden md:block">
                  <Button variant="ghost" size="sm">
                    {t("navComplaints")}
                  </Button>
                </Link>
                <Button variant="outline" size="icon-sm" onClick={signOut} aria-label={t("signOut")}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Link to="/auth">
                <Button size="sm">{t("signIn")}</Button>
              </Link>
            )}

            <Button
              variant="ghost"
              size="icon-sm"
              className="md:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label="Menu"
            >
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {open && (
          <nav className="flex flex-col border-t border-border/60 px-4 py-2 md:hidden">
            {[...NAV, { to: "/complaints", key: "navComplaints" } as const].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-2.5 text-sm text-muted-foreground hover:text-foreground"
              >
                {t(item.key)}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <main className="relative z-10">{children}</main>

      <footer className="relative z-10 mt-24 border-t border-border/60 px-4 py-10 text-center text-sm text-muted-foreground">
        <p>
          {t("brand")} — {t("tagline")}
        </p>
        <p className="mt-2 text-xs">
          Civic data routed to GHMC · HMWSSB · TGSRTC. Travel times and congestion are AI
          predictions from historical patterns, not official guarantees.
        </p>
      </footer>
    </div>
  );
}