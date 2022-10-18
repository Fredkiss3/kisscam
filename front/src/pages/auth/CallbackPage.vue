<template>
    <div class="h-screen flex flex-col items-center justify-center gap-4">
        <div class="flex gap-2 items-center justify-center h-screen w-full">
            <Loader class="h-10 w-10" />
            <h2 class="text-xl">Loading ...</h2>
        </div>
    </div>
</template>

<script lang="ts" setup>
// components
import Loader from '../../components/Loader.vue';

// utils
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '../../lib/supabase-client';
import { jsonFetch } from '../../lib/functions';

const router = useRouter();

async function checkUserSession() {
    const { data } = await supabase.auth.getSession();
    return data.session?.user;
}

onMounted(() => {
    checkUserSession().then((user) => {
        if (!user) {
            router.replace({
                name: 'login',
            });
        } else {
            jsonFetch<{ error: null | string }>(
                `//${import.meta.env.VITE_WS_URL}/create-user-if-not-exists`,
                {
                    method: 'POST',
                    body: JSON.stringify({
                        uid: user.id,
                    }),
                }
            ).then((res) => {
                if (res.error) {
                    console.error(res.error);
                } else {
                    router.replace({
                        name: 'profile',
                    });
                }
            });
        }
    });
});
</script>
