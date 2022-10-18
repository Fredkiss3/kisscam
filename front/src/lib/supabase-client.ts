import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
    // @ts-ignore
    import.meta.env.VITE_SUPABASE_URL,
    // @ts-ignore
    import.meta.env.VITE_SUPABASE_ANON_KEY
);
