<template>
    <Header v-if="!isLoading" />

    <main
        v-if="!isLoading"
        class="h-[80vh] flex flex-col items-center justify-center gap-4 p-8"
    >
        <router-view></router-view>
    </main>

    <footer
        v-if="!isLoading"
        class="fixed bottom-0 left-0 right-0 p-2 bg-dark flex items-center justify-center"
    >
        <div class="text-center">
            Copyright &copy; {{ new Date().getFullYear() }} by

            <a target="_blank" href="https://fredkiss.dev">
                <span class="underline">Adrien KISSIE</span>
            </a>

            &nbsp;contact me at

            <a class="font-bold underline" href="mailto:contact@kiss-cam.live">
                contact@kiss-cam.live
            </a>
        </div>
    </footer>

    <div
        v-if="isLoading"
        class="flex gap-2 items-center justify-center h-screen w-full"
    >
        <Loader class="h-14 w-14" />
        <h2 class="text-2xl font-bold">Checking if connected...</h2>
    </div>
</template>
<script setup lang="ts">
import { onUnmounted, ref, watchEffect } from 'vue';
import { useRouter } from 'vue-router';
import { useUserQuery } from '../lib/composables';

import Header from '../components/Header.vue';
import Loader from '../components/Loader.vue';
import { supabase } from '../lib/supabase-client';
import type { RealtimeChannel } from '@supabase/supabase-js';

const { isLoading, data: user } = useUserQuery();
const router = useRouter();
const supabaseSubscription = ref<RealtimeChannel | null>(null);

watchEffect(() => {
    if (!isLoading.value && !user.value) {
        router.replace({
            name: 'login',
        });
    }
});

watchEffect(() => {
    if (!isLoading && user.value) {
        // subscribe to subscription status
        supabaseSubscription.value = supabase
            .channel(`public:profile:id=eq.${user.value.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'profile',
                    filter: `id=eq.${user.value.id}`,
                },
                (payload) => {
                    // @ts-ignore
                    user.value = { ...user.value, ...payload.new };
                }
            )
            .subscribe();
    }
});

onUnmounted(() => {
    if (supabaseSubscription.value !== null) {
        supabaseSubscription.value.unsubscribe();
    }
});
</script>
