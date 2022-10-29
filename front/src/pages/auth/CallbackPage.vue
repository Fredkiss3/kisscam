<template>
    <div class="h-screen flex flex-col items-center justify-center gap-4">
        <div
            class="flex gap-2 items-center justify-center h-screen w-full relative"
        >
            <div
                class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-44 w-44 rounded-full bg-purple-500 blur-[200px] z-[-1]"
            ></div>
            <Loader class="h-10 w-10" />
            <h1 class="text-2xl">Creating your account...</h1>
        </div>
    </div>
</template>

<script lang="ts" setup>
// components
import Loader from '../../components/Loader.vue';

// utils
import { onMounted } from 'vue';
import { supabase } from '../../lib/supabase-client';
import { useCallbackMutation } from '../../lib/composables';

const callbackMutation = useCallbackMutation();

onMounted(() => {
    supabase.auth
        .getSession()
        .then(({ data }) => callbackMutation.mutateAsync(data.session));
});
</script>
