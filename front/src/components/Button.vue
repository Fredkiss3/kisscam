<template>
    <button
        :class="classes"
        :type="type"
        @click="emit('click')"
        :title="title"
        :disabled="disabled || loading"
    >
        <slot />
        <Loader v-if="loading" class="!mr-0 !ml-0" />
    </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Loader from '../components/Loader.vue';

interface Props {
    class?: string;
    variant?: 'primary' | 'danger' | 'hollow' | 'dark';
    type?: 'button' | 'submit';
    title?: string;
    disabled?: boolean;
    square?: boolean;
    loading?: boolean;
}

interface Events {
    (e: 'click'): void;
}

const props = withDefaults(defineProps<Props>(), {
    class: '',
    variant: 'primary',
    square: false,
    loading: false
});

const emit = defineEmits<Events>();

const classes = computed(() => {
    return {
        'bg-primary': props.variant === 'primary',
        'bg-danger': props.variant === 'danger',
        'bg-hollow': props.variant === 'hollow',
        'bg-dark': props.variant === 'dark',
        'bg-secondary cursor-not-allowed': !!props.disabled || props.loading,
        'p-2': props.square,
        'py-2 px-4': !props.square,
        'rounded-md font-bold text-white flex gap-2 items-center justify-center':
            true,
        [props.class]: true
    };
});
</script>
