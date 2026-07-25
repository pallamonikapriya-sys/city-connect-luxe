import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, Bus, Clock, ExternalLink, Gauge, Loader2, Route as RouteIcon } from "lucide-react";
import { toast } from "sonner";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLang } from "@/lib/i18n";
import { HYDERABAD_AREAS } from "@/lib/hyderabad";
import { planTrip, type RouteOption, type TravelPlan } from "@/lib/travel.functions";

export const Route = createFileRoute("/travel")({
  head: () => ({
    meta: [
      { title: "Hyderabad route planner & traffic prediction — Nagaram AI" },
      {
        name: "description",
        content:
          "Plan the best TGSRTC bus, metro and MMTS route across Hyderabad, see hour-by-hour congestion predictions from historical data and get alternative routes.",
      },
      { property: "og:title", content: "Hyderabad route planner & traffic prediction" },
      {
        property: "og:description",
        content: "Best routes, travel times, congestion forecasts and alternatives across Hyderabad.",
      },
    ],
  }),
  component: TravelPage,
});

function RouteCard({ option, highlight }: { option: RouteOption; highlight?: boolean }) {
  return (
    <div
      className={`glass-panel rounded-3xl p-6 ${highlight ? "ring-1 ring-primary/50" : ""}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Bus className="h-4 w-4 text-primary" />
        <h3 className="text-lg font-semibold">{option.name}</h3>
        <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs">{option.mode}</span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{option.summary}</p>
      <ol className="mt-4 space-y-2 border-l border-border/70 pl-4 text-sm">
        {(option.legs ?? []).map((leg, i) => (
          <li key={i} className="relative">
            <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-primary" />
            {leg}
          </li>
        ))}
      </ol>
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />~{option.duration_minutes} min
        </span>
        <span>₹ {option.fare_inr}</span>
        <span>{option.crowding}</span>
      </div>
      {option.why && <p className="mt-3 text-xs text-primary/90">{option.why}</p>}
    </div>
  );
}

function CongestionCurve({ plan }: { plan: TravelPlan }) {
  const max = Math.max(...plan.curve.map((p) => p.congestion), 1);
  return (
    <div className="glass-panel rounded-3xl p-6">
      <div className="flex items-center gap-2">
        <Gauge className="h-4 w-4 text-primary" />
        <h3 className="font-semibold">{plan.corridor}</h3>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {plan.congestionLabel} · {plan.predictedCongestion}/10 · ~{plan.predictedSpeed} km/h
      </p>
      <div className="mt-5 flex h-32 items-end gap-1">
        {plan.curve.map((p) => (
          <div key={p.hour} className="group relative flex-1">
            <div
              className={`w-full rounded-t transition-colors ${
                p.hour === plan.departHour ? "bg-primary" : "bg-primary/25 group-hover:bg-primary/50"
              }`}
              style={{ height: `${Math.max(4, (p.congestion / max) * 120)}px` }}
              title={`${String(p.hour).padStart(2, "0")}:00 — ${p.congestion}/10`}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
        <span>00:00</span>
        <span>12:00</span>
        <span>23:00</span>
      </div>
      <p className="mt-4 text-sm">{plan.bestWindow}</p>
    </div>
  );
}

function TravelPage() {
  const { t, lang } = useLang();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [hour, setHour] = useState(new Date().getHours());
  const [dayType, setDayType] = useState<"weekday" | "weekend">(() =>
    [0, 6].includes(new Date().getDay()) ? "weekend" : "weekday",
  );

  const mutation = useMutation({
    mutationFn: (input: { from: string; to: string }) =>
      planTrip({ data: { ...input, departHour: hour, dayType, language: lang } }),
    onError: (err: Error) => toast.error(err.message),
  });

  const plan = mutation.data;

  return (
    <SiteShell>
      <div className="mx-auto max-w-7xl px-4 py-14">
        <h1 className="text-4xl font-bold sm:text-5xl">
          <span className="text-teal">{lang === "te" ? "ప్రయాణ ప్రణాళిక" : "Route & traffic planner"}</span>
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          {lang === "te"
            ? "ఏ ప్రాంతం నుండి ఏ ప్రాంతానికైనా — ఉత్తమ బస్సు/మెట్రో మార్గం, ప్రయాణ సమయం, ట్రాఫిక్ అంచనా మరియు ప్రత్యామ్నాయ మార్గాలు."
            : "Any two points in Hyderabad — best bus and metro route, expected time, congestion forecast and alternatives."}
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate({ from, to });
          }}
          className="glass-panel mt-8 grid gap-4 rounded-3xl p-6 md:grid-cols-[1fr_1fr_auto_auto]"
        >
          <div>
            <Label htmlFor="from">{t("from")}</Label>
            <Input
              id="from"
              list="hyd-areas"
              required
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              placeholder="Charminar"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="to">{t("to")}</Label>
            <Input
              id="to"
              list="hyd-areas"
              required
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="HITEC City"
              className="mt-1.5"
            />
          </div>
          <datalist id="hyd-areas">
            {HYDERABAD_AREAS.map((a) => (
              <option key={a} value={a} />
            ))}
          </datalist>
          <div>
            <Label htmlFor="hour">{t("departAt")}</Label>
            <select
              id="hour"
              value={hour}
              onChange={(e) => setHour(Number(e.target.value))}
              className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {Array.from({ length: 24 }, (_, h) => (
                <option key={h} value={h}>
                  {String(h).padStart(2, "0")}:00
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <select
              value={dayType}
              onChange={(e) => setDayType(e.target.value as "weekday" | "weekend")}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              aria-label="Day type"
            >
              <option value="weekday">{lang === "te" ? "వారపు రోజు" : "Weekday"}</option>
              <option value="weekend">{lang === "te" ? "వారాంతం" : "Weekend"}</option>
            </select>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RouteIcon className="h-4 w-4" />}
              <span className="ml-1.5">{t("planRoute")}</span>
            </Button>
          </div>
        </form>

        {plan && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_1fr]"
          >
            <div className="space-y-6">
              {plan.best ? (
                <RouteCard option={plan.best} highlight />
              ) : (
                <div className="glass-panel rounded-3xl p-6 text-sm text-muted-foreground">
                  {plan.trafficNote || "Route suggestions are unavailable right now."}
                </div>
              )}
              {plan.alternatives.map((alt, i) => (
                <RouteCard key={i} option={alt} />
              ))}
            </div>

            <div className="space-y-6">
              <CongestionCurve plan={plan} />
              <div className="glass-panel rounded-3xl p-6 text-sm">
                {plan.trafficNote && <p className="mb-3">{plan.trafficNote}</p>}
                <p className="text-muted-foreground">{plan.gamyamNote}</p>
                <a
                  href={plan.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 text-primary hover:underline"
                >
                  {lang === "te" ? "Google Maps లో దారి చూపించు" : "Navigate on Google Maps"}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </motion.div>
        )}

        {!plan && !mutation.isPending && (
          <div className="mt-14 flex flex-wrap gap-3 text-sm text-muted-foreground">
            {[
              ["Charminar", "HITEC City"],
              ["Secunderabad", "Gachibowli"],
              ["LB Nagar", "Miyapur"],
              ["Kukatpally", "Banjara Hills"],
            ].map(([a, b]) => (
              <button
                key={a + b}
                onClick={() => {
                  setFrom(a);
                  setTo(b);
                  mutation.mutate({ from: a, to: b });
                }}
                className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 transition-colors hover:border-primary hover:text-foreground"
              >
                {a} <ArrowRight className="h-3.5 w-3.5" /> {b}
              </button>
            ))}
          </div>
        )}
      </div>
    </SiteShell>
  );
}