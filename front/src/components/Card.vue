<template>
    <div :class="classes" :title="title">
        <router-link
            :to="href"
            :class="[
                'flex justify-between gap-4 items-center',
                'focus:outline-none',
                'after:absolute after:inset-0 after:z-10 after:rounded-md',
                'group-focus-within:after:ring-2',
                'group-hover:after:ring-2 ',
                props.isCta
                    ? 'after:ring-primary'
                    : 'after:ring-white after:ring-opacity-40',
            ]"
        >
            <slot name="header" />
        </router-link>
        <small :class="['text-gray-400']">
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
        'rounded-md font-bold text-white p-4 h-40 w-60': true,
        'flex flex-col gap-4 items-start justify-between': true,
        'relative group': true,
        'bg-hollow-light': props.isCta,
        'bg-hollow': !props.isCta,
        [props.class]: true,
    };
});
</script>
