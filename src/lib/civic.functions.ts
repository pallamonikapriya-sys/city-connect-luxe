import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { channelForCategory } from "./hyderabad";
import type { Json } from "@/integrations/supabase/types";

export type ComplaintAnalysis = {
  category: string;
  categoryLabel: string;
  title: string;
  summary: string;
  severity: number;
  priority: "critical" | "high" | "medium" | "low";
  priorityReason: string;
  detectedInPhoto: string;
  publicHealthRisk: string;
  department: string;
  channelUrl: string;
  channelPhone: string;
  expectedResolutionDays: number;
  citizenAdvice: string;
};

const CATEGORY_LABEL: Record<string, string> = {
  water_leak: "Water leakage / pipeline burst",
  water_shortage: "Water shortage / no supply",
  water_quality: "Contaminated water",
  sewerage: "Sewerage overflow",
  garbage: "Garbage accumulation",
  debris: "Construction debris",
  blackspot: "Garbage black spot",
  sanitation: "Sanitation",
  other: "Other civic issue",
};

function clampPriority(value: string): ComplaintAnalysis["priority"] {
  return ["critical", "high", "medium", "low"].includes(value)
    ? (value as ComplaintAnalysis["priority"])
    : "medium";
}

export const analyzeComplaint = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      kind: "water" | "garbage";
      description: string;
      area?: string;
      landmark?: string;
      photoDataUrl?: string;
      language: "en" | "te";
    }) => {
      if (!input.description?.trim() || input.description.trim().length < 8) {
        throw new Error("Please describe the problem in a little more detail.");
      }
      return {
        kind: input.kind === "garbage" ? ("garbage" as const) : ("water" as const),
        description: input.description.trim().slice(0, 2000),
        area: input.area?.slice(0, 120) ?? "",
        landmark: input.landmark?.slice(0, 160) ?? "",
        photoDataUrl:
          input.photoDataUrl && input.photoDataUrl.startsWith("data:image/")
            ? input.photoDataUrl.slice(0, 8_000_000)
            : undefined,
        language: input.language === "te" ? ("te" as const) : ("en" as const),
      };
    },
  )
  .handler(async ({ data }): Promise<ComplaintAnalysis> => {
    const { requireLovableApiKey, AI_GATEWAY_URL } = await import("./ai-gateway.server");
    const apiKey = requireLovableApiKey();

    const allowed =
      data.kind === "water"
        ? ["water_leak", "water_shortage", "water_quality", "sewerage"]
        : ["garbage", "debris", "blackspot", "sanitation", "other"];

    const instruction = `You are a GHMC / HMWSSB civic complaint triage officer for Hyderabad.
A citizen reports a ${data.kind} problem.
Area: ${data.area || "not given"}. Landmark: ${data.landmark || "not given"}.
Description: ${data.description}
${data.photoDataUrl ? "A photo is attached — inspect it carefully. Describe exactly what waste, leak, stagnant water or overflow you can see, estimate the volume, and note any health hazards (mosquito breeding, stray animals, blocked footpath, sewage mixing)." : "No photo attached."}

Classify into exactly one category from: ${allowed.join(", ")}.
Score severity 1-10 and assign priority using these rules:
- critical: drinking-water contamination, sewage mixing with water supply, major pipeline burst flooding a road, or garbage blocking a hospital/school entrance
- high: no water for 2+ days, large uncollected dumps, overflowing sewers near homes
- medium: routine leakage, missed collection, small dumps
- low: cosmetic or single-household inconvenience

Return STRICT JSON only, no markdown fence:
{"category":"","title":"","summary":"","severity":0,"priority":"","priority_reason":"","detected_in_photo":"","public_health_risk":"","expected_resolution_days":0,"citizen_advice":""}
Write title, summary, priority_reason, detected_in_photo, public_health_risk and citizen_advice in ${
      data.language === "te" ? "Telugu (తెలుగు script)" : "English"
    }. Keep the title under 70 characters.`;

    const content: unknown[] = [{ type: "text", text: instruction }];
    if (data.photoDataUrl) {
      content.push({ type: "image_url", image_url: { url: data.photoDataUrl } });
    }

    const res = await fetch(`${AI_GATEWAY_URL}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
      body: JSON.stringify({
        model: "google/gemini-3.6-flash",
        messages: [{ role: "user", content }],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      if (res.status === 429) throw new Error("Too many requests right now — please retry in a moment.");
      if (res.status === 402) throw new Error("AI credits exhausted for this workspace.");
      throw new Error(`Triage failed (${res.status}): ${body.slice(0, 300)}`);
    }

    const payload = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = payload.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw.replace(/^```json\s*|```$/g, "")) as Record<string, unknown>;

    const category = allowed.includes(String(parsed.category))
      ? String(parsed.category)
      : allowed[0];
    const channel = channelForCategory(category);
    const severity = Math.min(10, Math.max(1, Number(parsed.severity) || 5));

    return {
      category,
      categoryLabel: CATEGORY_LABEL[category] ?? category,
      title: String(parsed.title ?? "Civic complaint").slice(0, 90),
      summary: String(parsed.summary ?? data.description),
      severity,
      priority: clampPriority(String(parsed.priority)),
      priorityReason: String(parsed.priority_reason ?? ""),
      detectedInPhoto: String(parsed.detected_in_photo ?? ""),
      publicHealthRisk: String(parsed.public_health_risk ?? ""),
      department: channel.department,
      channelUrl: channel.url,
      channelPhone: channel.phone,
      expectedResolutionDays: Math.max(1, Number(parsed.expected_resolution_days) || 3),
      citizenAdvice: String(parsed.citizen_advice ?? ""),
    };
  });

export type ComplaintRow = {
  id: string;
  reference_code: string;
  category: string;
  title: string;
  description: string;
  area: string | null;
  landmark: string | null;
  photo_url: string | null;
  severity: number;
  priority: string;
  department: string;
  channel_url: string | null;
  channel_phone: string | null;
  status: string;
  created_at: string;
};

export const submitComplaint = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      analysis: ComplaintAnalysis;
      description: string;
      area?: string;
      landmark?: string;
      photoPath?: string;
    }) => input,
  )
  .handler(async ({ data, context }): Promise<ComplaintRow> => {
    const a = data.analysis;
    const { data: row, error } = await context.supabase
      .from("complaints")
      .insert({
        user_id: context.userId,
        category: a.category,
        title: a.title,
        description: data.description,
        area: data.area || null,
        landmark: data.landmark || null,
        photo_url: data.photoPath || null,
        severity: a.severity,
        priority: a.priority,
        department: a.department,
        channel_url: a.channelUrl,
        channel_phone: a.channelPhone,
        ai_analysis: a as unknown as Json,
      })
      .select(
        "id, reference_code, category, title, description, area, landmark, photo_url, severity, priority, department, channel_url, channel_phone, status, created_at",
      )
      .single();
    if (error) throw new Error(error.message);
    return row as ComplaintRow;
  });

export const listComplaints = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ComplaintRow[]> => {
    const { data, error } = await context.supabase
      .from("complaints")
      .select(
        "id, reference_code, category, title, description, area, landmark, photo_url, severity, priority, department, channel_url, channel_phone, status, created_at",
      )
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as ComplaintRow[];
  });

export const updateComplaintStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; status: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("complaints")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });