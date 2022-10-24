import { supabase } from './supabase-client';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQuery, useMutation } from '@tanstack/vue-query';
import { jsonFetch, wait } from './functions';
import { loadStripe } from '@stripe/stripe-js';

import type { User as SupabaseUser } from '@supabase/supabase-js';

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
        // @ts-ignore
        if (import.meta.env.MODE !== 'development') {
            await wait(1500);
        }

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

export function useCheckoutSessionMutation(user?: User | null) {
    return useMutation(async () => {
        const stripe = await loadStripe(
            // @ts-ignore
            import.meta.env.VITE_STRIPE_PUBLIC_KEY
        );

        if (stripe && user) {
            const res = await jsonFetch<
                | { id: string; error: undefined }
                | { error: string; id: undefined }
            >(
                // @ts-ignore
                `//${import.meta.env.VITE_WS_URL}/api/create-checkout-session`,
                {
                    method: 'POST',
                    body: JSON.stringify({
                        uid: user.id,
                    }),
                }
            );

            if (res.error !== undefined) {
                console.log(res.error);
            } else {
                await stripe.redirectToCheckout({
                    sessionId: res.id,
                });
            }
        }
    });
}

export function usePortalSessionMutation(user?: User | null) {
    return useMutation(async () => {
        if (user) {
            const res = await jsonFetch<
                | { url: string; error: undefined }
                | { error: string; url: undefined }
            >(`//${import.meta.env.VITE_WS_URL}/api/create-portal-session`, {
                method: 'POST',
                body: JSON.stringify({
                    uid: user.id,
                }),
            });

            if (res.error !== undefined) {
                console.log(res.error);
            } else {
                window.location.href = res.url;
            }
        }
    });
}
