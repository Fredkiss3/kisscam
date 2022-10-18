import { supabase } from './supabase-client';
import { onMounted, ref } from 'vue';
import type { Session } from '@supabase/supabase-js';
import { useRouter } from 'vue-router';

async function getSession() {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
        console.error('Supabase error : ' + error);
    }

    return data;
}

export function useAuthedSession() {
    const router = useRouter();
    const isLoading = ref(true);
    let session = ref<Session | null>(null);
    onMounted(() => {
        getSession()
            .then((data) => {
                if (!data.session) {
                    router.replace({
                        name: 'login',
                    });
                    return;
                }
            })
            .finally(() => (isLoading.value = false));
    });

    return {
        session: session,
        isLoading,
    };
}
