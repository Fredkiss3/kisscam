<template>
    <button
        :class="classes"
        :type="type"
        @click="emit('click')"
        :title="title"
        :disabled="disabled"
    >
        <slot />
    </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
    class?: string;
    variant?: 'primary' | 'danger' | 'hollow' | 'dark';
    type?: 'button' | 'submit';
    title?: string;
    disabled?: boolean;
    square?: boolean;
}

interface Events {
    (e: 'click'): void;
}

const props = withDefaults(defineProps<Props>(), {
    class: '',
    variant: 'primary',
    square: false
});

const emit = defineEmits<Events>();

const classes = computed(() => {
    return {
        'bg-primary': props.variant === 'primary',
        'bg-danger': props.variant === 'danger',
        'bg-hollow': props.variant === 'hollow',
        'bg-dark': props.variant === 'dark',
        'disabled:bg-secondary cursor-not-allowed': !!props.disabled,
        'p-2': props.square,
        'py-2 px-4': !props.square,
        'rounded-md font-bold text-white flex gap-2 items-center justify-center':
            true,
        [props.class]: true
    };
});
</script>
