<template>
    <div :class="classes">
        <ChatIcon class="-scale-x-100 h-6" />

        <h2 class="font-bold text-lg">Chat</h2>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ChatIcon } from '@heroicons/vue/solid';

interface Props {
    class?: string;
}

const props = withDefaults(defineProps<Props>(), {
    class: '',
});

const classes = computed(() => {
    return {
        'border-secondary/50 bg-darker border px-8 rounded-2xl': true,
        'flex items-center gap-4': true,
        [props.class]: true,
    };
});
</script>
