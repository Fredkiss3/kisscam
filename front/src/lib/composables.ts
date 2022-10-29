import { supabase } from './supabase-client';
import { useRouter } from 'vue-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { jsonFetch, wait } from './functions';
import { loadStripe } from '@stripe/stripe-js';

import type {
    Session as SupabaseSession,
    User as SupabaseUser,
} from '@supabase/supabase-js';
import { ref } from 'vue';

export type Profile = {
    created_at: string;
    id: string;
    stripe_customer_id: string;
    subscription_end_at: string | null;
    subscribed_at: string | null;
    access_token: string;
};

export type User = SupabaseUser & Profile;

export const showFooter = ref(true);

export function useLogoutMutation() {
    const router = useRouter();
    const queryClient = useQueryClient(); // empty user data

    return useMutation(
        async () => {
            await supabase.auth.signOut();
        },
        {
            onSuccess: async () => {
                // Invalidate and refetch
                await queryClient.invalidateQueries(['session']);
                router.replace({
                    name: 'login',
                });
            },
        }
    );
}

export function useUserQuery() {
    return useQuery<User | null>(
        ['session'],
        async () => {
            // @ts-ignore
            if (import.meta.env.MODE !== 'development') {
                await wait(1500);
            }

            const {
                data: { session },
                error,
            } = await supabase.auth.getSession();

            if (error) {
                console.error('Supabase error : ' + error);
                throw error;
            }

            if (session?.user) {
                // get profile data
                const { data: profile } = await supabase
                    .from('profile')
                    .select()
                    .eq('id', session.user.id);

                if (profile.length > 0) {
                    return {
                        ...session.user,
                        ...profile[0],
                        access_token: session.access_token,
                    };
                }
            }

            return null;
        },
        {
            staleTime: 50 * 60 * 1000, // 50 minutes * 60 seconds * 1000 milliseconds
        }
    );
}

export function useCheckoutSessionMutation() {
    const queryClient = useQueryClient();
    const user = queryClient.getQueryData<User>(['session']);

    return useMutation(async () => {
        const stripe = await loadStripe(
            // @ts-ignore
            import.meta.env.VITE_STRIPE_PUBLIC_KEY
        );

        if (stripe && user) {
            const res = await jsonFetch<{ id: string }>(
                // @ts-ignore
                `//${import.meta.env.VITE_WS_URL}/api/create-checkout-session`,
                {
                    method: 'POST',
                    body: JSON.stringify({
                        uid: user.id,
                    }),
                    headers: {
                        Authorization: `Bearer ${user.access_token}`,
                    },
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

export function usePortalSessionMutation() {
    const queryClient = useQueryClient();

    const user = queryClient.getQueryData<User>(['session']);

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
                headers: {
                    Authorization: `Bearer ${user.access_token}`,
                },
            });

            if (res.error !== undefined) {
                console.log(res.error);
            } else {
                window.location.href = res.url;
            }
        }
    });
}

export function useCallbackMutation() {
    const router = useRouter();

    return useMutation(async (session: SupabaseSession | null) => {
        if (!session) {
            router.replace({
                name: 'login',
                state: {
                    error: 'A server error has occurred, please log in again',
                },
            });
            return;
        }

        const res = await jsonFetch(
            `//${
                // @ts-ignore
                import.meta.env.VITE_WS_URL
            }/api/create-user-if-not-exists`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({}),
            }
        );

        if (res.error) {
            console.error({ err: res.error, code: res.statusCode });

            router.replace({
                name: 'login',
                state: {
                    error: 'A server error has occurred, please log in again',
                },
            });
        } else {
            router.replace({
                name: 'dashboard',
            });
        }
    });
}
