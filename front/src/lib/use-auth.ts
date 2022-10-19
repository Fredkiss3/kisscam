import { supabase } from './supabase-client';
import { onMounted, ref } from 'vue';
import type { Session } from '@supabase/supabase-js';
import { useRouter } from 'vue-router';
import { wait } from './functions';

async function getSession() {
    await wait(2000);
    const { data, error } = await supabase.auth.getSession();

    if (error) {
        console.error('Supabase error : ' + error);
    }

    return data;
}

let session = ref<Session | null>(null);
const isLoading = ref(true);

export function useAuthedSession() {
    const router = useRouter();
    onMounted(() => {
        getSession()
            .then((data) => {
                if (!data.session) {
                    router.replace({
                        name: 'login',
                    });
                    return;
                } else {
                    session.value = data.session;
                }
            })
            .finally(() => {
                isLoading.value = false;
            });
    });

    const logout = async () => {
        await supabase.auth.signOut();
        session.value = null;
        router.replace({
            name: 'login',
        });
    };

    return {
        session: session,
        isLoading,
        logout,
    };
}
