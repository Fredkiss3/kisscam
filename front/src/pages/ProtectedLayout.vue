<template>
    <Header
        v-if="
            !isLoading &&
            route.name !== 'call-room' &&
            route.name !== 'podcast-room'
        "
    />

    <main
        v-if="!isLoading"
        :class="[
            route.name !== 'call-room' && route.name !== 'podcast-room'
                ? 'h-[80vh]'
                : 'h-screen',
            'flex flex-col items-center justify-center gap-4 p-8',
        ]"
    >
        <div
            class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-44 w-44 rounded-full bg-purple-500 blur-[200px] z-[-1]"
        ></div>
        <router-view></router-view>
    </main>

    <Footer v-if="!isLoading" />

    <div
        v-if="isLoading"
        class="flex gap-2 items-center justify-center h-screen w-full"
    >
        <Loader class="h-14 w-14" />
        <h2 class="text-2xl font-bold">Checking if connected...</h2>
    </div>
</template>
<script setup lang="ts">
import Footer from '../components/Footer.vue';
import Header from '../components/Header.vue';
import Loader from '../components/Loader.vue';

import { onUnmounted, ref, watchEffect } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserQuery } from '../lib/composables';
import { supabase } from '../lib/supabase-client';
import type { RealtimeChannel } from '@supabase/supabase-js';

const { isLoading, data: user } = useUserQuery();
const router = useRouter();
const route = useRoute();
const supabaseSubscription = ref<RealtimeChannel | null>(null);

watchEffect(() => {
    if (!isLoading.value && user.value) {
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
    } else if (!isLoading.value && !user.value) {
        router.replace({
            name: 'login',
        });
    }
});

onUnmounted(() => {
    if (supabaseSubscription.value !== null) {
        supabaseSubscription.value.unsubscribe();
    }
});
</script>
