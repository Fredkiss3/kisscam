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
    variant?: 'primary' | 'danger' | 'hollow';
    type?: 'button' | 'submit';
    title?: string;
    disabled?: boolean;
}

type Events = {
    (e: 'click'): void;
};

const props = withDefaults(defineProps<Props>(), {
    class: '',
    variant: 'primary'
});

const emit = defineEmits<Events>();

const classes = computed(() => {
    return {
        'bg-primary': props.variant === 'primary',
        'bg-danger': props.variant === 'danger',
        'bg-hollow': props.variant === 'hollow',
        'disabled:bg-secondary cursor-not-allowed': !!props.disabled,
        'py-2 px-4 rounded-md font-bold text-white flex gap-2 items-center justify-center':
            true,
        [props.class]: true
    };
});
</script>
