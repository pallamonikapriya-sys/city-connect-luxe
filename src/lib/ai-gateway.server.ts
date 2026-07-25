import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1";

export function createLovableAiGatewayProvider(apiKey: string) {
  return createOpenAICompatible({
    name: "lovable",
    baseURL: AI_GATEWAY_URL,
    headers: { "Lovable-API-Key": apiKey },
  });
}

export function requireLovableApiKey(): string {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  return key;
}