import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

type Body = { messages?: UIMessage[]; threadId?: string; language?: "en" | "te" };

function systemPrompt(language: "en" | "te") {
  return `You are Nagaram AI, a warm, practical civic assistant for Hyderabad, Telangana, India.

You help citizens with:
- Buses (TSRTC/TGSRTC route numbers), Hyderabad Metro (Red: Miyapur–LB Nagar, Blue: Nagole–Raidurg, Green: JBS–MGBS), MMTS trains, autos and cabs, and the Gamyam / T-Savaari live-bus app.
- Best routes, expected travel times, traffic congestion patterns and alternative routes between any two places in Hyderabad.
- Water problems: leakage, pipeline bursts, no supply, tanker booking and HMWSSB complaints (helpline 155313, hyderabadwater.gov.in).
- Garbage, sanitation and other GHMC grievances (helpline 040-21111111, ghmc.gov.in/Grievance.aspx, SWM 1800-425-0111).
- Places, food, history and events around Charminar, Hussain Sagar, Golconda, HITEC City and the rest of the city.

Rules:
- Reply in ${language === "te" ? "Telugu using తెలుగు script" : "English"} unless the user clearly writes in the other language, in which case match them.
- Be specific: name roads, junctions, metro stations, bus numbers and helpline numbers.
- Give approximate travel times and fares, and always say they are estimates.
- If someone describes a water or garbage problem, tell them the exact department, helpline and complaint link, and suggest they file it in the app's Report section so it gets priority-scored.
- Keep answers tight — short paragraphs, bullets where useful. Never invent official complaint numbers.`;
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { userClientFromRequest } = await import("@/lib/supabase-request.server");
        const auth = await userClientFromRequest(request);
        if (!auth) return new Response("Unauthorized", { status: 401 });

        const body = (await request.json()) as Body;
        const messages = body.messages;
        if (!Array.isArray(messages) || messages.length === 0) {
          return new Response("Messages are required", { status: 400 });
        }

        const threadId = body.threadId;
        if (!threadId) return new Response("threadId is required", { status: 400 });

        const { data: thread } = await auth.client
          .from("chat_threads")
          .select("id")
          .eq("id", threadId)
          .maybeSingle();
        if (!thread) return new Response("Thread not found", { status: 404 });

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const { createLovableAiGatewayProvider } = await import("@/lib/ai-gateway.server");
        const gateway = createLovableAiGatewayProvider(key);

        const language = body.language === "te" ? "te" : "en";
        const last = messages[messages.length - 1];

        if (last?.role === "user") {
          const { error } = await auth.client.from("chat_messages").insert({
            thread_id: threadId,
            user_id: auth.userId,
            client_message_id: last.id,
            role: "user",
            parts: last.parts as unknown as Record<string, unknown>[],
          });
          if (error) console.error("[chat] failed to persist user message", error.message);

          const text = last.parts
            .map((p) => (p.type === "text" ? p.text : ""))
            .join(" ")
            .trim();
          if (messages.length === 1 && text) {
            await auth.client
              .from("chat_threads")
              .update({ title: text.slice(0, 70) })
              .eq("id", threadId);
          }
        }

        let result;
        try {
          result = streamText({
            model: gateway("google/gemini-3.6-flash"),
            system: systemPrompt(language),
            messages: convertToModelMessages(messages),
          });
        } catch (err) {
          console.error("[chat] model error", err);
          return new Response("The assistant is unavailable right now.", { status: 502 });
        }

        return result.toUIMessageStreamResponse({
          originalMessages: messages,
          onFinish: async ({ responseMessage }) => {
            const { error } = await auth.client.from("chat_messages").insert({
              thread_id: threadId,
              user_id: auth.userId,
              client_message_id: responseMessage.id,
              role: "assistant",
              parts: responseMessage.parts as unknown as Record<string, unknown>[],
            });
            if (error) console.error("[chat] failed to persist assistant message", error.message);
            await auth.client
              .from("chat_threads")
              .update({ updated_at: new Date().toISOString() })
              .eq("id", threadId);
          },
        });
      },
    },
  },
});