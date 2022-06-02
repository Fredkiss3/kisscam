<template>
    <div class="h-screen flex items-center justify-center flex-col gap-4">
        <h1>{{ props.message }}</h1>

        <a href="#/" class="flex gap-2 items-center underline">
            <ArrowLeftIcon class="h-4" />
            Go Home
        </a>
    </div>
</template>

<script setup lang="ts">
import { ArrowLeftIcon } from '@heroicons/vue/outline';

interface Props {
    message?: string;
}

const props = withDefaults(defineProps<Props>(), {
    message: '404 - Page not found'
});
</script>
