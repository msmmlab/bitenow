-- Create venue_intents table
CREATE TABLE IF NOT EXISTS public.venue_intents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    party_size TEXT,
    intent_type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Basic RLS
ALTER TABLE public.venue_intents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable insert for everyone" ON public.venue_intents
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable select for service role" ON public.venue_intents
    FOR SELECT USING (true);
