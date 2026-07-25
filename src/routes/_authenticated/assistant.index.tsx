import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { createThread, listThreads } from "@/lib/chat.functions";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/assistant/")({
  component: AssistantIndex,
});

function AssistantIndex() {
  const navigate = useNavigate();
  const { lang } = useLang();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      const threads = await listThreads();
      const target = threads[0] ?? (await createThread({ data: { language: lang } }));
      navigate({ to: "/assistant/$threadId", params: { threadId: target.id }, replace: true });
    })();
  }, [navigate, lang]);

  return (
    <SiteShell>
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    </SiteShell>
  );
}