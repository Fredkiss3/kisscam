<template>
    <router-link :to="href" :class="classes" :title="title">
        <slot />
    </router-link>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
    class?: string;
    variant?: 'primary' | 'danger' | 'hollow';
    title?: string;
    href: string;
}

const props = withDefaults(defineProps<Props>(), {
    class: '',
    variant: 'primary',
});

const classes = computed(() => {
    return {
        'bg-primary': props.variant === 'primary',
        'bg-danger': props.variant === 'danger',
        'bg-hollow': props.variant === 'hollow',
        'py-2 px-4 rounded-md font-bold text-white flex gap-2 items-center':
            true,
        [props.class]: true,
    };
});
</script>
