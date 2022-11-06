import { User } from '@supabase/supabase-js';
import { supabaseAdmin } from './supabase-server';

/**
 * Generate an array of numbers from start to the end
 *
 * @example
 *      range(1, 5);
 *      // => [1, 2, 3, 4]
 * @param start
 * @param end
 * @returns
 */
export function range(start: number, end: number): number[] {
    return Array.from({ length: end - start }, (_, i) => i + start);
}

export async function checkIfUserIsSubscribed(user: User | null) {
    const { data: profiles } = await supabaseAdmin
        .from('profile')
        .select()
        .eq('id', user?.id);

    if (user && profiles.length > 0) {
        const profile = profiles[0];
        const expDate = new Date(profile?.subscription_end_at!);
        const today = new Date();

        return expDate < today;
    }

    return false;
}
