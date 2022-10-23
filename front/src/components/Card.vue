<template>
    <div :class="classes" :title="title">
        <router-link
            :to="href"
            class="flex justify-between gap-4 items-center after:absolute after:inset-0 after:z-10"
        >
            <slot name="header" />
        </router-link>
        <small class="text-gray-400">
            <slot />
        </small>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
    class?: string;
    title?: string;
    href: string;
    isCta?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    class: '',
    variant: 'primary',
    isCta: false,
});

const classes = computed(() => {
    return {
        'ring-primary': props.isCta,
        'ring-white ring-opacity-40': !props.isCta,
        'rounded-md font-bold text-white p-4 h-40 w-60': true,
        'flex flex-col gap-4 items-start justify-between': true,
        'bg-hollow relative': true,
        'hover:ring-2': true,
        [props.class]: true,
    };
});
</script>
