import { createServerFn } from "@tanstack/react-start";

export type HourPoint = { hour: number; congestion: number; speed: number };

export type RouteOption = {
  name: string;
  mode: string;
  summary: string;
  legs: string[];
  duration_minutes: number;
  fare_inr: string;
  crowding: string;
  why: string;
};

export type TravelPlan = {
  corridor: string;
  dayType: string;
  departHour: number;
  predictedCongestion: number;
  predictedSpeed: number;
  congestionLabel: string;
  curve: HourPoint[];
  bestWindow: string;
  best: RouteOption | null;
  alternatives: RouteOption[];
  trafficNote: string;
  mapsUrl: string;
  gamyamNote: string;
};

function labelFor(index: number) {
  if (index >= 6.5) return "Severe";
  if (index >= 5) return "Heavy";
  if (index >= 3.5) return "Moderate";
  return "Free flowing";
}

function tokens(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3);
}

export const planTrip = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      from: string;
      to: string;
      departHour: number;
      dayType: "weekday" | "weekend";
      language: "en" | "te";
    }) => {
      if (!input.from?.trim() || !input.to?.trim()) throw new Error("Origin and destination are required");
      return {
        from: input.from.trim().slice(0, 120),
        to: input.to.trim().slice(0, 120),
        departHour: Math.min(23, Math.max(0, Math.round(input.departHour))),
        dayType: input.dayType === "weekend" ? ("weekend" as const) : ("weekday" as const),
        language: input.language === "te" ? ("te" as const) : ("en" as const),
      };
    },
  )
  .handler(async ({ data }): Promise<TravelPlan> => {
    const { createClient } = await import("@supabase/supabase-js");
    const url = process.env.SUPABASE_URL!;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
    const supabase = createClient(url, key, {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const headers = new Headers(init?.headers);
          if (headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
          headers.set("apikey", key);
          return fetch(input, { ...init, headers });
        },
      },
    });

    const { data: rows } = await supabase
      .from("traffic_history")
      .select("corridor, from_area, to_area, hour, congestion_index, avg_speed_kmph")
      .eq("day_type", data.dayType);

    const history = rows ?? [];
    const queryTokens = new Set([...tokens(data.from), ...tokens(data.to)]);

    let bestCorridor = "Hyderabad city average";
    let bestScore = 0;
    const corridors = Array.from(new Set(history.map((r) => r.corridor)));
    for (const corridor of corridors) {
      const sample = history.find((r) => r.corridor === corridor)!;
      const corridorTokens = new Set([
        ...tokens(sample.from_area),
        ...tokens(sample.to_area),
        ...tokens(corridor),
      ]);
      let score = 0;
      corridorTokens.forEach((t) => {
        if (queryTokens.has(t)) score += 1;
      });
      if (score > bestScore) {
        bestScore = score;
        bestCorridor = corridor;
      }
    }

    const scoped = bestScore > 0 ? history.filter((r) => r.corridor === bestCorridor) : history;
    const curve: HourPoint[] = Array.from({ length: 24 }, (_, hour) => {
      const atHour = scoped.filter((r) => r.hour === hour);
      const congestion = atHour.length
        ? atHour.reduce((s, r) => s + Number(r.congestion_index), 0) / atHour.length
        : 0;
      const speed = atHour.length
        ? atHour.reduce((s, r) => s + Number(r.avg_speed_kmph), 0) / atHour.length
        : 0;
      return { hour, congestion: Math.round(congestion * 100) / 100, speed: Math.round(speed * 10) / 10 };
    });

    const now = curve[data.departHour];
    const windowCandidates = curve
      .filter((p) => p.hour >= data.departHour && p.hour <= Math.min(23, data.departHour + 4))
      .sort((a, b) => a.congestion - b.congestion);
    const bestHour = windowCandidates[0]?.hour ?? data.departHour;
    const fmt = (h: number) => `${String(h).padStart(2, "0")}:00`;
    const bestWindow =
      bestHour === data.departHour
        ? `${fmt(data.departHour)} is already the calmest slot in the next few hours.`
        : `Leaving at ${fmt(bestHour)} instead of ${fmt(data.departHour)} cuts congestion from ${now.congestion} to ${windowCandidates[0].congestion}.`;

    const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
      data.from + ", Hyderabad",
    )}&destination=${encodeURIComponent(data.to + ", Hyderabad")}&travelmode=transit`;

    let best: RouteOption | null = null;
    let alternatives: RouteOption[] = [];
    let trafficNote = "";

    try {
      const { requireLovableApiKey, AI_GATEWAY_URL } = await import("./ai-gateway.server");
      const apiKey = requireLovableApiKey();
      const prompt = `You are a Hyderabad (Telangana, India) transit expert who knows TSRTC/TGSRTC bus numbers, Hyderabad Metro Rail corridors (Red: Miyapur–LB Nagar, Blue: Nagole–Raidurg, Green: JBS–MGBS), MMTS trains, and the Gamyam / T-Savaari live bus tracking app.
Plan a trip from "${data.from}" to "${data.to}" in Hyderabad, departing around ${fmt(data.departHour)} on a ${data.dayType}.
Historical congestion for the "${bestCorridor}" corridor at that hour is ${now.congestion}/10 with average traffic speed ${now.speed} km/h.
Return STRICT JSON only, no markdown fence, with this shape:
{"best":{"name":"","mode":"","summary":"","legs":["step 1","step 2"],"duration_minutes":0,"fare_inr":"","crowding":"","why":""},
"alternatives":[{same shape}, {same shape}],
"traffic_note":""}
Use realistic bus route numbers and metro stations. Keep each field short. Write ALL text in ${
        data.language === "te" ? "Telugu (తెలుగు script)" : "English"
      }. Give exactly 2 alternatives, at least one avoiding the congested corridor.`;

      const res = await fetch(`${AI_GATEWAY_URL}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
        body: JSON.stringify({
          model: "google/gemini-3.6-flash",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
        }),
      });

      if (res.ok) {
        const payload = (await res.json()) as {
          choices?: { message?: { content?: string } }[];
        };
        const raw = payload.choices?.[0]?.message?.content ?? "{}";
        const parsed = JSON.parse(raw.replace(/^```json\s*|```$/g, "")) as {
          best?: RouteOption;
          alternatives?: RouteOption[];
          traffic_note?: string;
        };
        best = parsed.best ?? null;
        alternatives = (parsed.alternatives ?? []).slice(0, 3);
        trafficNote = parsed.traffic_note ?? "";
      } else {
        trafficNote = `Route engine unavailable (${res.status}). Congestion prediction below is still live.`;
      }
    } catch (err) {
      trafficNote = err instanceof Error ? err.message : "Route engine unavailable.";
    }

    return {
      corridor: bestCorridor,
      dayType: data.dayType,
      departHour: data.departHour,
      predictedCongestion: now.congestion,
      predictedSpeed: now.speed,
      congestionLabel: labelFor(now.congestion),
      curve,
      bestWindow,
      best,
      alternatives,
      trafficNote,
      mapsUrl,
      gamyamNote:
        "Cross-check live bus positions in the Gamyam / T-Savaari app before you leave — this plan uses scheduled services plus historical congestion.",
    };
  });