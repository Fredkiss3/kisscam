import { supabase } from './supabase-client';
import { onMounted, onUnmounted, ref } from 'vue';
import type {
    RealtimeChannel,
    User as SupabaseUser,
} from '@supabase/supabase-js';
import { useRouter } from 'vue-router';

export type User = SupabaseUser & {
    created_at: string;
    id: string;
    stripe_customer_id: string;
    subscription_end_at: string | null;
    subscribed_at: string | null;
};

let user = ref<User | null>(null);
const isLoading = ref(true);
const supabaseSubscription = ref<RealtimeChannel | null>(null);

async function getSession() {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
        console.error('Supabase error : ' + error);
    }

    return data;
}

export function useAuthedUser() {
    const router = useRouter();
    onMounted(() => {
        getSession()
            .then(async (data) => {
                if (!data.user) {
                    router.replace({
                        name: 'login',
                    });
                    return;
                } else {
                    // get profile data
                    const { data: profile } = await supabase
                        .from('profile')
                        .select()
                        .eq('id', data.user.id);

                    if (profile.length === 0) {
                        router.replace({
                            name: 'login',
                        });
                        return;
                    }

                    user.value = { ...data.user, ...profile[0] };
                    // subscribe to subscription status
                    supabaseSubscription.value = supabase
                        .channel(`public:profile:id=eq.${data.user.id}`)
                        .on(
                            'postgres_changes',
                            {
                                event: 'UPDATE',
                                schema: 'public',
                                table: 'profile',
                                filter: `id=eq.${data.user.id}`,
                            },
                            (payload) => {
                                // @ts-expect-error
                                user.value = { ...user.value, ...payload.new };
                            }
                        )
                        .subscribe();
                }
            })
            .finally(() => {
                isLoading.value = false;
            });
    });

    const logout = async () => {
        await supabase.auth.signOut();
        user.value = null;
        router.replace({
            name: 'login',
        });
    };

    onUnmounted(() => {
        if (supabaseSubscription.value !== null) {
            supabaseSubscription.value.unsubscribe();
        }
    });

    return {
        user,
        isLoading,
        logout,
    };
}
