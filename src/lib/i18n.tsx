import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Lang } from "./hyderabad";

type Dict = Record<string, { en: string; te: string }>;

export const T: Dict = {
  brand: { en: "Nagaram AI", te: "నగరం AI" },
  tagline: {
    en: "The cinematic civic companion for Hyderabad",
    te: "హైదరాబాద్ కోసం మీ నగర సహాయకుడు",
  },
  navHome: { en: "Home", te: "హోమ్" },
  navPlaces: { en: "Places", te: "ప్రదేశాలు" },
  navTravel: { en: "Travel", te: "ప్రయాణం" },
  navAssistant: { en: "Assistant", te: "సహాయకుడు" },
  navReport: { en: "Report", te: "ఫిర్యాదు" },
  navComplaints: { en: "My complaints", te: "నా ఫిర్యాదులు" },
  signIn: { en: "Sign in", te: "సైన్ ఇన్" },
  signOut: { en: "Sign out", te: "సైన్ అవుట్" },
  heroTitle: { en: "Your city, answered.", te: "మీ నగరం, సమాధానంతో." },
  heroBody: {
    en: "Talk to Hyderabad in Telugu or English. Plan the fastest bus and metro routes, predict congestion before you leave, and get water and garbage complaints to the right municipal desk in seconds.",
    te: "తెలుగు లేదా ఇంగ్లీషులో హైదరాబాద్‌తో మాట్లాడండి. వేగవంతమైన బస్సు, మెట్రో మార్గాలు, ట్రాఫిక్ అంచనాలు, నీటి మరియు చెత్త ఫిర్యాదులు — అన్నీ ఒకే చోట.",
  },
  ctaAssistant: { en: "Talk to the assistant", te: "సహాయకుడితో మాట్లాడండి" },
  ctaReport: { en: "Report an issue", te: "సమస్యను నివేదించండి" },
  askPlaceholder: { en: "Ask about buses, water, garbage, places…", te: "బస్సులు, నీరు, చెత్త, ప్రదేశాల గురించి అడగండి…" },
  listening: { en: "Listening…", te: "వింటున్నాను…" },
  speak: { en: "Speak", te: "మాట్లాడండి" },
  stopSpeaking: { en: "Stop voice", te: "వాయిస్ ఆపండి" },
  newChat: { en: "New conversation", te: "కొత్త సంభాషణ" },
  thinking: { en: "Thinking…", te: "ఆలోచిస్తున్నాను…" },
  from: { en: "From", te: "నుండి" },
  to: { en: "To", te: "వరకు" },
  departAt: { en: "Departing at", te: "బయలుదేరే సమయం" },
  planRoute: { en: "Plan my route", te: "మార్గం సూచించు" },
  water: { en: "Water", te: "నీరు" },
  garbage: { en: "Garbage", te: "చెత్త" },
  submit: { en: "Submit complaint", te: "ఫిర్యాదు సమర్పించండి" },
  analyzing: { en: "Analyzing…", te: "విశ్లేషిస్తోంది…" },
};

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (k: keyof typeof T | string) => string };

const LangContext = createContext<Ctx>({ lang: "en", setLang: () => {}, t: (k) => String(k) });

const STORAGE_KEY = "nagaram.lang";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "te" || saved === "en") setLangState(saved);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    window.localStorage.setItem(STORAGE_KEY, l);
  }, []);

  const t = useCallback(
    (key: string) => {
      const entry = T[key];
      return entry ? entry[lang] : key;
    },
    [lang],
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}

export const LANG_NAME: Record<Lang, string> = { en: "English", te: "తెలుగు" };
export const SPEECH_LOCALE: Record<Lang, string> = { en: "en-IN", te: "te-IN" };