import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { MapPin, Search, ExternalLink } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { TiltCard } from "@/components/tilt-card";
import { Input } from "@/components/ui/input";
import { listPlaces } from "@/lib/places.functions";
import { useLang } from "@/lib/i18n";

const placesQuery = queryOptions({ queryKey: ["places"], queryFn: () => listPlaces() });

export const Route = createFileRoute("/places")({
  head: () => ({
    meta: [
      { title: "Hyderabad places & landmarks — Nagaram AI" },
      {
        name: "description",
        content:
          "Browse Charminar, Golconda, Hussain Sagar, HITEC City and every major Hyderabad area and transit hub, with directions on Google Maps.",
      },
      { property: "og:title", content: "Hyderabad places & landmarks — Nagaram AI" },
      { property: "og:description", content: "Landmarks, areas and transit hubs across Hyderabad." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(placesQuery),
  errorComponent: () => (
    <SiteShell>
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="text-2xl font-semibold">Places couldn't load</h1>
        <p className="mt-2 text-muted-foreground">Please refresh and try again.</p>
      </div>
    </SiteShell>
  ),
  notFoundComponent: () => (
    <SiteShell>
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">Nothing here.</div>
    </SiteShell>
  ),
  component: PlacesPage,
});

function PlacesPage() {
  const { data } = useSuspenseQuery(placesQuery);
  const { lang } = useLang();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");

  const categories = useMemo(
    () => ["all", ...Array.from(new Set(data.map((p) => p.category)))],
    [data],
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return data.filter(
      (p) =>
        (cat === "all" || p.category === cat) &&
        (!needle ||
          p.name.toLowerCase().includes(needle) ||
          p.area.toLowerCase().includes(needle) ||
          (p.name_te ?? "").includes(needle)),
    );
  }, [data, q, cat]);

  return (
    <SiteShell>
      <div className="mx-auto max-w-7xl px-4 py-14">
        <h1 className="text-4xl font-bold sm:text-5xl">
          <span className="text-teal">{lang === "te" ? "హైదరాబాద్ ప్రదేశాలు" : "Places of Hyderabad"}</span>
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          {lang === "te"
            ? "చార్మినార్ నుండి హైటెక్ సిటీ వరకు — ప్రతి ముఖ్యమైన ప్రదేశం, మ్యాప్ లింక్‌తో."
            : "From Charminar to HITEC City — landmarks, hubs and neighbourhoods, each one route-ready."}
        </p>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={lang === "te" ? "ప్రదేశం లేదా ఏరియా వెతకండి…" : "Search a place or area…"}
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`rounded-full border px-3.5 py-1.5 text-xs capitalize transition-colors ${
                  cat === c
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {c.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: Math.min(i, 8) * 0.04 }}
            >
              <TiltCard className="glass-panel h-full rounded-3xl p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">{lang === "te" && p.name_te ? p.name_te : p.name}</h2>
                    <p className="mt-0.5 text-xs uppercase tracking-wide text-muted-foreground">
                      {p.area} · {p.category.replace(/_/g, " ")}
                    </p>
                  </div>
                  <MapPin className="h-4 w-4 shrink-0 text-primary" />
                </div>
                {p.description && (
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{p.description}</p>
                )}
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  {lang === "te" ? "మ్యాప్‌లో చూడండి" : "Open in Maps"}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </TiltCard>
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="mt-16 text-center text-muted-foreground">
            {lang === "te" ? "ఫలితాలు లేవు." : "No matching places."}
          </p>
        )}
      </div>
    </SiteShell>
  );
}