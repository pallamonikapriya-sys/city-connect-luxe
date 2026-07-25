import { createFileRoute, useNavigate, useParams, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Mic, MicOff, Plus, Trash2, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { useLang } from "@/lib/i18n";
import { useVoice } from "@/hooks/use-voice";
import { supabase } from "@/integrations/supabase/client";
import {
  createThread,
  deleteThread,
  getThreadMessages,
  listThreads,
} from "@/lib/chat.functions";
import mark from "@/assets/nagaram-mark.png";

export const Route = createFileRoute("/_authenticated/assistant/$threadId")({
  component: AssistantThread,
  errorComponent: () => (
    <SiteShell>
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-xl font-semibold">This conversation couldn't load</h1>
        <Link to="/assistant" className="mt-4 inline-block text-primary hover:underline">
          Start a new one
        </Link>
      </div>
    </SiteShell>
  ),
  notFoundComponent: () => (
    <SiteShell>
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">Conversation not found.</div>
    </SiteShell>
  ),
});

function textOf(message: UIMessage) {
  return message.parts
    .map((p) => (p.type === "text" ? p.text : ""))
    .join("")
    .trim();
}

const SUGGESTIONS: Record<"en" | "te", string[]> = {
  en: [
    "Best bus from Charminar to HITEC City right now?",
    "No water in Kukatpally for two days — what do I do?",
    "Which metro line goes to Secunderabad?",
    "Garbage not collected in Dilsukhnagar — who do I call?",
  ],
  te: [
    "చార్మినార్ నుండి హైటెక్ సిటీకి ఉత్తమ బస్సు ఏది?",
    "కూకట్‌పల్లిలో రెండు రోజులుగా నీరు లేదు — ఏం చేయాలి?",
    "సికింద్రాబాద్‌కు ఏ మెట్రో లైన్ వెళ్తుంది?",
    "దిల్‌సుఖ్‌నగర్‌లో చెత్త తీయలేదు — ఎవరికి ఫిర్యాదు చేయాలి?",
  ],
};

function AssistantThread() {
  const { threadId } = useParams({ from: "/_authenticated/assistant/$threadId" });
  const { lang, t } = useLang();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const spokenRef = useRef<string | null>(null);
  const voice = useVoice(lang);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setToken(data.session?.access_token ?? null));
  }, []);

  const threadsQuery = useQuery({ queryKey: ["threads"], queryFn: () => listThreads() });
  const historyQuery = useQuery({
    queryKey: ["thread", threadId],
    queryFn: () => getThreadMessages({ data: { threadId } }),
  });

  const initialMessages = useMemo<UIMessage[]>(
    () =>
      (historyQuery.data?.messages ?? []).map((m) => ({
        id: m.id,
        role: m.role,
        parts: m.parts,
      })) as UIMessage[],
    [historyQuery.data],
  );

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: { threadId, language: lang },
      }),
    [token, threadId, lang],
  );

  const { messages, sendMessage, status } = useChat({
    id: threadId,
    messages: initialMessages,
    transport,
    onError: (error) => toast.error(error.message || "The assistant hit an error"),
    onFinish: () => {
      queryClient.invalidateQueries({ queryKey: ["threads"] });
    },
  });

  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (!busy) textareaRef.current?.focus();
  }, [busy, threadId]);

  useEffect(() => {
    if (!autoSpeak || busy) return;
    const last = messages[messages.length - 1];
    if (!last || last.role !== "assistant") return;
    if (spokenRef.current === last.id) return;
    spokenRef.current = last.id;
    const text = textOf(last);
    if (text) voice.speak(text);
  }, [messages, busy, autoSpeak, voice]);

  const send = useCallback(
    (text: string) => {
      const value = text.trim();
      if (!value || busy || !token) return;
      setInput("");
      sendMessage({ text: value });
    },
    [busy, sendMessage, token],
  );

  const newThread = async () => {
    const thread = await createThread({ data: { language: lang } });
    await queryClient.invalidateQueries({ queryKey: ["threads"] });
    navigate({ to: "/assistant/$threadId", params: { threadId: thread.id } });
  };

  const removeThread = async (id: string) => {
    await deleteThread({ data: { id } });
    const remaining = await queryClient.fetchQuery({ queryKey: ["threads"], queryFn: () => listThreads() });
    if (id === threadId) {
      const next = remaining[0] ?? (await createThread({ data: { language: lang } }));
      navigate({ to: "/assistant/$threadId", params: { threadId: next.id }, replace: true });
    }
  };

  return (
    <SiteShell>
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[260px_1fr]">
        <aside className="glass-panel hidden h-[76vh] flex-col rounded-3xl p-4 lg:flex">
          <Button onClick={newThread} className="w-full" size="sm">
            <Plus className="h-4 w-4" />
            <span className="ml-1.5">{t("newChat")}</span>
          </Button>
          <div className="mt-4 flex-1 space-y-1 overflow-y-auto">
            {(threadsQuery.data ?? []).map((thread) => (
              <div
                key={thread.id}
                className={`group flex items-center gap-1 rounded-xl px-2 py-2 text-sm transition-colors ${
                  thread.id === threadId ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/60"
                }`}
              >
                <Link
                  to="/assistant/$threadId"
                  params={{ threadId: thread.id }}
                  className="line-clamp-1 flex-1 text-left"
                >
                  {thread.title}
                </Link>
                <button
                  type="button"
                  onClick={() => removeThread(thread.id)}
                  aria-label="Delete conversation"
                  className="opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5 hover:text-destructive" />
                </button>
              </div>
            ))}
          </div>
        </aside>

        <section className="glass-panel flex h-[76vh] flex-col rounded-3xl p-4">
          <div className="mb-3 flex items-center gap-3 border-b border-border/60 pb-3">
            <img src={mark} alt="" className="h-8 w-8" />
            <div className="flex-1">
              <h1 className="text-sm font-semibold">{t("brand")}</h1>
              <p className="text-xs text-muted-foreground">
                {lang === "te" ? "తెలుగు / ఇంగ్లీష్ నగర సహాయకుడు" : "Telugu / English city assistant"}
              </p>
            </div>
            <Button
              variant={autoSpeak ? "default" : "outline"}
              size="icon-sm"
              onClick={() => {
                if (autoSpeak) voice.stopSpeaking();
                setAutoSpeak(!autoSpeak);
              }}
              aria-label={autoSpeak ? t("stopSpeaking") : t("speak")}
            >
              {autoSpeak ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="icon-sm" onClick={newThread} className="lg:hidden" aria-label={t("newChat")}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <Conversation className="flex-1">
            <ConversationContent>
              {historyQuery.isLoading && (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              )}

              {!historyQuery.isLoading && messages.length === 0 && (
                <div className="py-10 text-center">
                  <img src={mark} alt="" className="mx-auto h-16 w-16 animate-float-slow" />
                  <p className="mt-4 text-sm text-muted-foreground">
                    {lang === "te"
                      ? "హైదరాబాద్ గురించి ఏదైనా అడగండి — బస్సులు, నీరు, చెత్త, ప్రదేశాలు."
                      : "Ask anything about Hyderabad — buses, water, garbage, places."}
                  </p>
                  <div className="mx-auto mt-6 flex max-w-xl flex-wrap justify-center gap-2">
                    {SUGGESTIONS[lang].map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="rounded-full border border-border px-3.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((message) => (
                <Message from={message.role} key={message.id}>
                  <MessageContent>
                    {message.parts.map((part, i) =>
                      part.type === "text" ? (
                        <MessageResponse key={i}>{part.text}</MessageResponse>
                      ) : null,
                    )}
                  </MessageContent>
                </Message>
              ))}

              {status === "submitted" && <Shimmer>{t("thinking")}</Shimmer>}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          <PromptInput
            className="mt-3"
            onSubmit={(_, event) => {
              event.preventDefault();
              send(input);
            }}
          >
            <PromptInputTextarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={voice.listening ? t("listening") : t("askPlaceholder")}
            />
            <PromptInputFooter className="justify-end gap-2">
              {voice.supported && (
                <Button
                  type="button"
                  variant={voice.listening ? "default" : "outline"}
                  size="icon-sm"
                  aria-label={voice.listening ? t("listening") : t("speak")}
                  onClick={() => {
                    if (voice.listening) {
                      voice.stopListening();
                      return;
                    }
                    voice.listen((text) => send(text));
                  }}
                >
                  {voice.listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
              )}
              <PromptInputSubmit status={status} disabled={!input.trim() || busy} />
            </PromptInputFooter>
          </PromptInput>
        </section>
      </div>
    </SiteShell>
  );
}