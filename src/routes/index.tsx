import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Bus, Droplets, Trash2, MessageSquareText, MapPin, Gauge } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { TiltCard } from "@/components/tilt-card";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import charminar from "@/assets/hero-charminar.jpg";
import sagar from "@/assets/hussain-sagar.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nagaram AI — Hyderabad routes, traffic & civic complaints" },
      {
        name: "description",
        content:
          "A cinematic Hyderabad companion: Telugu and English voice assistant, best bus and metro routes, congestion predictions, and water and garbage complaints routed to GHMC and HMWSSB.",
      },
      { property: "og:title", content: "Nagaram AI — Hyderabad routes, traffic & civic complaints" },
      {
        property: "og:description",
        content: "Talk to Hyderabad in Telugu or English. Routes, traffic and civic complaints in one place.",
      },
    ],
  }),
  component: Index,
});

const FEATURES = [
  {
    icon: MessageSquareText,
    en: { t: "Telugu + English assistant", d: "Ask by voice or text. Nagaram replies in your language and reads answers back aloud." },
    te: { t: "తెలుగు + ఇంగ్లీష్ సహాయకుడు", d: "వాయిస్ లేదా టెక్స్ట్‌లో అడగండి. మీ భాషలోనే సమాధానం, చదివి కూడా వినిపిస్తుంది." },
  },
  {
    icon: Bus,
    en: { t: "Best bus & metro route", d: "TGSRTC buses, metro corridors and MMTS combined with live Gamyam guidance." },
    te: { t: "ఉత్తమ బస్సు & మెట్రో మార్గం", d: "టీజీఎస్‌ఆర్‌టీసీ బస్సులు, మెట్రో, ఎంఎంటీఎస్ — గమ్యం సూచనలతో కలిపి." },
  },
  {
    icon: Gauge,
    en: { t: "Congestion prediction", d: "Hour-by-hour congestion from historical corridor data, plus the calmest time to leave." },
    te: { t: "ట్రాఫిక్ అంచనా", d: "గంటల వారీ రద్దీ అంచనా, బయలుదేరడానికి ఉత్తమ సమయం." },
  },
  {
    icon: Droplets,
    en: { t: "Water complaint desk", d: "Leaks, bursts and shortages packaged for HMWSSB with helpline 155313." },
    te: { t: "నీటి ఫిర్యాదు", d: "లీకేజీ, కొరత — జల మండలికి, హెల్ప్‌లైన్ 155313." },
  },
  {
    icon: Trash2,
    en: { t: "Garbage photo triage", d: "Upload a photo — AI detects the dump, scores severity and routes it to GHMC SWM." },
    te: { t: "చెత్త ఫోటో విశ్లేషణ", d: "ఫోటో అప్‌లోడ్ చేయండి — AI తీవ్రతను అంచనా వేసి జీహెచ్‌ఎం‌సీకి పంపుతుంది." },
  },
  {
    icon: MapPin,
    en: { t: "Every corner of the city", d: "Charminar to HITEC City — landmarks, areas and transit hubs with maps links." },
    te: { t: "నగరం మొత్తం", d: "చార్మినార్ నుండి హైటెక్ సిటీ వరకు — ప్రదేశాలు, మ్యాప్ లింక్‌లతో." },
  },
];

function Index() {
  const { t, lang } = useLang();
  const [scroll, setScroll] = useState(0);

  useEffect(() => {
    const onScroll = () => setScroll(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <SiteShell>
      <section className="relative flex min-h-[92vh] items-center overflow-hidden scene-3d">
        <div
          className="absolute inset-0 -z-10"
          style={{ transform: `translate3d(0, ${scroll * 0.28}px, 0) scale(${1 + scroll * 0.0004})` }}
        >
          <img src={charminar} alt="Charminar lit up at night above the Old City of Hyderabad" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/55 via-background/75 to-background" />
        </div>

        <div className="mx-auto w-full max-w-7xl px-4 py-24">
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/40 px-4 py-1.5 text-xs tracking-widest uppercase text-muted-foreground backdrop-blur"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-primary animate-pulse-ring" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            Hyderabad · హైదరాబాద్
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 40, rotateX: 10 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 0.9, delay: 0.05 }}
            className="max-w-4xl text-5xl leading-[1.05] font-bold sm:text-6xl lg:text-7xl"
          >
            <span className="text-gold">{t("heroTitle")}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.15 }}
            className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            {t("heroBody")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.25 }}
            className="mt-9 flex flex-wrap gap-3"
          >
            <Link to="/assistant">
              <Button size="lg">{t("ctaAssistant")}</Button>
            </Link>
            <Link to="/report">
              <Button size="lg" variant="outline">
                {t("ctaReport")}
              </Button>
            </Link>
            <Link to="/travel">
              <Button size="lg" variant="ghost">
                {lang === "te" ? "మార్గం ప్లాన్ చేయండి" : "Plan a route"}
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20">
        <h2 className="text-3xl font-bold sm:text-4xl">
          {lang === "te" ? "ఒకే చోట మీ నగరం" : "One city, one console"}
        </h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          {lang === "te"
            ? "ప్రయాణం, నీరు, చెత్త — ప్రతి పౌర అవసరానికి ఒక తెలివైన సహాయకుడు."
            : "Transit, water and waste — every civic need handled by one assistant that knows Hyderabad."}
        </p>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => {
            const copy = f[lang];
            const Icon = f.icon;
            return (
              <motion.div
                key={copy.t}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: i * 0.06 }}
              >
                <TiltCard className="glass-panel h-full rounded-3xl p-6">
                  <div className="mb-4 inline-flex rounded-2xl bg-primary/15 p-3 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold">{copy.t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{copy.d}</p>
                </TiltCard>
              </motion.div>
            );
          })}
        </div>
      </section>

      <section className="relative overflow-hidden py-24">
        <img
          src={sagar}
          alt="The illuminated Buddha statue at Hussain Sagar lake at dusk"
          className="absolute inset-0 -z-10 h-full w-full object-cover opacity-45"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-background via-background/70 to-transparent" />
        <div className="mx-auto max-w-7xl px-4">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-xl"
          >
            <h2 className="text-3xl font-bold sm:text-4xl">
              {lang === "te" ? "ఫిర్యాదు — 60 సెకన్లలో" : "A complaint, in 60 seconds"}
            </h2>
            <p className="mt-4 text-muted-foreground">
              {lang === "te"
                ? "సమస్యను వివరించండి లేదా ఫోటో అప్‌లోడ్ చేయండి. AI దానిని వర్గీకరించి, తీవ్రతను స్కోర్ చేసి, సరైన మున్సిపల్ విభాగానికి — జీహెచ్‌ఎం‌సీ లేదా జల మండలికి — దారి చూపుతుంది."
                : "Describe the problem or upload a photo. Nagaram classifies it, scores severity, sets priority and hands you the exact GHMC or HMWSSB channel with a reference code to track."}
            </p>
            <div className="mt-7 flex gap-3">
              <Link to="/report">
                <Button size="lg">{t("ctaReport")}</Button>
              </Link>
              <Link to="/places">
                <Button size="lg" variant="outline">
                  {t("navPlaces")}
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </SiteShell>
  );
}
