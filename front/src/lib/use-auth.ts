import { supabase } from './supabase-client';
import { onMounted, onUnmounted, ref } from 'vue';
import type {
    RealtimeChannel,
    User as SupabaseUser,
} from '@supabase/supabase-js';
import { useRouter } from 'vue-router';
import { useQuery, useMutation } from '@tanstack/vue-query';
import { wait } from './functions';

export type User = SupabaseUser & {
    created_at: string;
    id: string;
    stripe_customer_id: string;
    subscription_end_at: string | null;
    subscribed_at: string | null;
};

let user = ref<User | null>(null);

async function getSession() {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
        console.error('Supabase error : ' + error);
    }

    return data?.session?.user;
}

export function useLogoutMutation() {
    const router = useRouter();

    return useMutation(async () => {
        await supabase.auth.signOut();
        user.value = null;
        router.replace({
            name: 'login',
        });
    });
}

export function useUserQuery() {
    return useQuery<User | null>(['session'], async () => {
        await wait(1500);
        const user = await getSession();

        if (user) {
            // get profile data
            const { data: profile } = await supabase
                .from('profile')
                .select()
                .eq('id', user.id);
            if (profile.length > 0) {
                return { ...user, ...profile[0] };
            }
        }

        return null;
    });
}
