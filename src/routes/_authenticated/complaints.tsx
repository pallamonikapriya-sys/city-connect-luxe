import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { ExternalLink, Loader2, Phone } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import { PRIORITY_LABEL, PRIORITY_ORDER } from "@/lib/hyderabad";
import { listComplaints } from "@/lib/civic.functions";

export const Route = createFileRoute("/_authenticated/complaints")({
  component: ComplaintsPage,
  errorComponent: () => (
    <SiteShell>
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">Complaints couldn't load.</div>
    </SiteShell>
  ),
  notFoundComponent: () => (
    <SiteShell>
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">Not found.</div>
    </SiteShell>
  ),
});

const PRIORITY_STYLE: Record<string, string> = {
  critical: "bg-destructive text-destructive-foreground",
  high: "bg-chart-1 text-background",
  medium: "bg-chart-4 text-background",
  low: "bg-muted text-muted-foreground",
};

function ComplaintsPage() {
  const { lang, t } = useLang();
  const { data, isLoading } = useQuery({ queryKey: ["complaints"], queryFn: () => listComplaints() });

  const sorted = [...(data ?? [])].sort(
    (a, b) => (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9),
  );

  return (
    <SiteShell>
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-4xl font-bold">
            <span className="text-teal">{t("navComplaints")}</span>
          </h1>
          <Link to="/report">
            <Button>{t("ctaReport")}</Button>
          </Link>
        </div>

        {isLoading && (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {!isLoading && sorted.length === 0 && (
          <p className="mt-16 text-center text-muted-foreground">
            {lang === "te" ? "ఇంకా ఫిర్యాదులు లేవు." : "No complaints filed yet."}
          </p>
        )}

        <div className="mt-8 space-y-4">
          {sorted.map((c, i) => (
            <motion.article
              key={c.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: Math.min(i, 8) * 0.04 }}
              className="glass-panel rounded-3xl p-6"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${PRIORITY_STYLE[c.priority]}`}>
                  {PRIORITY_LABEL[c.priority]?.[lang] ?? c.priority}
                </span>
                <span className="rounded-full bg-accent px-3 py-1 text-xs">{c.reference_code}</span>
                <span className="rounded-full bg-accent px-3 py-1 text-xs capitalize">
                  {c.category.replace(/_/g, " ")}
                </span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {new Date(c.created_at).toLocaleDateString()}
                </span>
              </div>

              <h2 className="mt-3 text-lg font-semibold">{c.title}</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">{c.description}</p>
              {(c.area || c.landmark) && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {[c.area, c.landmark].filter(Boolean).join(" · ")}
                </p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                <span className="text-muted-foreground">{c.department}</span>
                {c.channel_phone && (
                  <a href={`tel:${c.channel_phone}`} className="inline-flex items-center gap-1.5 text-primary hover:underline">
                    <Phone className="h-3.5 w-3.5" />
                    {c.channel_phone}
                  </a>
                )}
                {c.channel_url && (
                  <a
                    href={c.channel_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-primary hover:underline"
                  >
                    {lang === "te" ? "పోర్టల్" : "Portal"}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
                <span className="ml-auto rounded-full border border-border px-3 py-1 text-xs capitalize">
                  {c.status}
                </span>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </SiteShell>
  );
}