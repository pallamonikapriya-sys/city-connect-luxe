import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
export type StoredMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  parts: { type: string; text?: string }[];
};

export type ThreadRow = {
  id: string;
  title: string;
  language: string;
  updated_at: string;
};

export const listThreads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ThreadRow[]> => {
    const { data, error } = await context.supabase
      .from("chat_threads")
      .select("id, title, language, updated_at")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { title?: string; language?: string }) => input ?? {})
  .handler(async ({ data, context }): Promise<ThreadRow> => {
    const { data: row, error } = await context.supabase
      .from("chat_threads")
      .insert({
        user_id: context.userId,
        title: data.title?.slice(0, 80) || "New conversation",
        language: data.language ?? "en",
      })
      .select("id, title, language, updated_at")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const renameThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; title: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("chat_threads")
      .update({ title: data.title.slice(0, 80) })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("chat_threads").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getThreadMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { threadId: string }) => input)
  .handler(async ({ data, context }): Promise<{ thread: ThreadRow | null; messages: StoredMessage[] }> => {
    const { data: thread } = await context.supabase
      .from("chat_threads")
      .select("id, title, language, updated_at")
      .eq("id", data.threadId)
      .maybeSingle();

    if (!thread) return { thread: null, messages: [] };

    const { data: rows, error } = await context.supabase
      .from("chat_messages")
      .select("id, role, parts, created_at")
      .eq("thread_id", data.threadId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);

    const messages: StoredMessage[] = (rows ?? []).map((r) => ({
      id: r.id,
      role: r.role as StoredMessage["role"],
      parts: (r.parts as StoredMessage["parts"]) ?? [],
    }));
    return { thread, messages };
  });