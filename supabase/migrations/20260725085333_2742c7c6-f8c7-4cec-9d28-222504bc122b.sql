
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT,
  preferred_language TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name) VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.chat_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New conversation',
  language TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_threads TO authenticated;
GRANT ALL ON public.chat_threads TO service_role;
ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own threads" ON public.chat_threads FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX chat_threads_user_idx ON public.chat_threads (user_id, updated_at DESC);
CREATE TRIGGER chat_threads_updated BEFORE UPDATE ON public.chat_threads FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.chat_threads ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  client_message_id TEXT,
  role TEXT NOT NULL,
  parts JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own messages" ON public.chat_messages FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX chat_messages_thread_idx ON public.chat_messages (thread_id, created_at);

CREATE TABLE public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  reference_code TEXT NOT NULL DEFAULT ('HYD-' || upper(substr(md5(random()::text), 1, 8))),
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  area TEXT,
  landmark TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  photo_url TEXT,
  severity INTEGER NOT NULL DEFAULT 3,
  priority TEXT NOT NULL DEFAULT 'medium',
  department TEXT NOT NULL DEFAULT 'GHMC',
  channel_url TEXT,
  channel_phone TEXT,
  status TEXT NOT NULL DEFAULT 'submitted',
  ai_analysis JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.complaints TO authenticated;
GRANT ALL ON public.complaints TO service_role;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own complaints" ON public.complaints FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX complaints_user_idx ON public.complaints (user_id, created_at DESC);
CREATE TRIGGER complaints_updated BEFORE UPDATE ON public.complaints FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_te TEXT,
  area TEXT NOT NULL,
  category TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  description TEXT
);
GRANT SELECT ON public.places TO anon, authenticated;
GRANT ALL ON public.places TO service_role;
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;
CREATE POLICY "places are public" ON public.places FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.traffic_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corridor TEXT NOT NULL,
  from_area TEXT NOT NULL,
  to_area TEXT NOT NULL,
  day_type TEXT NOT NULL,
  hour INTEGER NOT NULL,
  congestion_index NUMERIC NOT NULL,
  avg_speed_kmph NUMERIC NOT NULL
);
GRANT SELECT ON public.traffic_history TO anon, authenticated;
GRANT ALL ON public.traffic_history TO service_role;
ALTER TABLE public.traffic_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "traffic is public" ON public.traffic_history FOR SELECT TO anon, authenticated USING (true);
CREATE INDEX traffic_corridor_idx ON public.traffic_history (corridor, day_type, hour);

INSERT INTO public.places (name, name_te, area, category, lat, lng, description) VALUES
('Charminar', 'చార్మినార్', 'Old City', 'monument', 17.3616, 78.4747, '1591 mosque-monument at the heart of the old city, ringed by Laad Bazaar.'),
('Hussain Sagar & Buddha Statue', 'హుస్సేన్ సాగర్', 'Tank Bund', 'lake', 17.4239, 78.4738, 'Heart-shaped lake with the monolithic Buddha statue on Gibraltar Rock.'),
('Golconda Fort', 'గోల్కొండ కోట', 'Golconda', 'monument', 17.3833, 78.4011, 'Hilltop fort famed for its acoustics and sound-and-light show.'),
('Ramoji Film City', 'రామోజీ ఫిల్మ్ సిటీ', 'Hayathnagar', 'attraction', 17.2543, 78.6808, 'World''s largest film studio complex.'),
('Salar Jung Museum', 'సాలార్ జంగ్ మ్యూజియం', 'Darulshifa', 'museum', 17.3713, 78.4803, 'One of India''s largest one-man art collections.'),
('Chowmahalla Palace', 'చౌమహల్లా ప్యాలెస్', 'Khilwat', 'monument', 17.3578, 78.4717, 'Seat of the Asaf Jahi dynasty.'),
('Birla Mandir', 'బిర్లా మందిర్', 'Naubath Pahad', 'temple', 17.4062, 78.4691, 'White marble temple overlooking Hussain Sagar.'),
('HITEC City', 'హైటెక్ సిటీ', 'Madhapur', 'business', 17.4435, 78.3772, 'Hyderabad''s IT and business district.'),
('Durgam Cheruvu', 'దుర్గం చెరువు', 'Jubilee Hills', 'lake', 17.4293, 78.3906, 'Secret lake with the cable-stayed bridge.'),
('KBR National Park', 'కేబీఆర్ పార్క్', 'Jubilee Hills', 'park', 17.4239, 78.4172, 'Urban forest and walking loop.'),
('Secunderabad Railway Station', 'సికింద్రాబాద్ స్టేషన్', 'Secunderabad', 'transit', 17.4340, 78.5012, 'Major rail hub of the twin cities.'),
('MGBS Bus Station', 'ఎంజీబీఎస్', 'Gowliguda', 'transit', 17.3785, 78.4818, 'Mahatma Gandhi Bus Station, the main TSRTC terminus.'),
('Rajiv Gandhi Intl Airport', 'శంషాబాద్ విమానాశ్రయం', 'Shamshabad', 'transit', 17.2403, 78.4294, 'Hyderabad''s international airport.'),
('Laad Bazaar', 'లాడ్ బజార్', 'Old City', 'market', 17.3611, 78.4731, 'Bangle and pearl market beside Charminar.'),
('Nehru Zoological Park', 'నెహ్రూ జూ పార్క్', 'Bahadurpura', 'park', 17.3510, 78.4510, 'One of India''s largest zoos.'),
('Ameerpet', 'అమీర్‌పేట', 'Ameerpet', 'hub', 17.4374, 78.4487, 'Coaching and metro interchange hub.'),
('Gachibowli', 'గచ్చిబౌలి', 'Gachibowli', 'business', 17.4401, 78.3489, 'Financial district and stadium area.'),
('Kukatpally', 'కూకట్‌పల్లి', 'KPHB', 'hub', 17.4948, 78.3996, 'Dense residential and retail hub.'),
('Begumpet', 'బేగంపేట', 'Begumpet', 'hub', 17.4435, 78.4645, 'Central corridor along the flyover.'),
('LB Nagar', 'ఎల్‌బీ నగర్', 'LB Nagar', 'hub', 17.3457, 78.5522, 'South-east metro terminus and junction.');

INSERT INTO public.traffic_history (corridor, from_area, to_area, day_type, hour, congestion_index, avg_speed_kmph)
SELECT c.corridor, c.from_area, c.to_area, d.day_type, h.hour,
  round((c.base
    + CASE WHEN h.hour BETWEEN 8 AND 11 THEN 2.6 WHEN h.hour BETWEEN 17 AND 21 THEN 3.1 WHEN h.hour BETWEEN 12 AND 16 THEN 1.2 ELSE 0 END
    * CASE WHEN d.day_type = 'weekend' THEN 0.55 ELSE 1 END)::numeric, 2),
  round(greatest(6, 46 - (c.base
    + CASE WHEN h.hour BETWEEN 8 AND 11 THEN 2.6 WHEN h.hour BETWEEN 17 AND 21 THEN 3.1 WHEN h.hour BETWEEN 12 AND 16 THEN 1.2 ELSE 0 END
    * CASE WHEN d.day_type = 'weekend' THEN 0.55 ELSE 1 END) * 5.4)::numeric, 1)
FROM (VALUES
  ('Old City – Charminar to MGBS', 'Old City', 'Gowliguda', 4.4),
  ('Tank Bund – Secunderabad to Necklace Road', 'Secunderabad', 'Tank Bund', 3.6),
  ('Ameerpet to HITEC City', 'Ameerpet', 'Madhapur', 4.8),
  ('Gachibowli to Financial District', 'Gachibowli', 'Nanakramguda', 3.9),
  ('LB Nagar to Koti', 'LB Nagar', 'Koti', 4.1),
  ('Kukatpally to Ameerpet', 'KPHB', 'Ameerpet', 4.6),
  ('Begumpet to Panjagutta', 'Begumpet', 'Panjagutta', 3.8),
  ('Shamshabad Airport to Mehdipatnam', 'Shamshabad', 'Mehdipatnam', 2.9)
) AS c(corridor, from_area, to_area, base)
CROSS JOIN (VALUES ('weekday'), ('weekend')) AS d(day_type)
CROSS JOIN generate_series(0, 23) AS h(hour);
