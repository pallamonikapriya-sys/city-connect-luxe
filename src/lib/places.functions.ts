import { createServerFn } from "@tanstack/react-start";

export type Place = {
  id: string;
  name: string;
  name_te: string | null;
  area: string;
  category: string;
  description: string | null;
  lat: number;
  lng: number;
};

export const listPlaces = createServerFn({ method: "GET" }).handler(async (): Promise<Place[]> => {
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

  const { data, error } = await supabase
    .from("places")
    .select("id, name, name_te, area, category, description, lat, lng")
    .order("name");
  if (error) throw new Error(error.message);
  return (data ?? []) as Place[];
});