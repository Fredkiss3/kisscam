<template>
    <input
        :autofocus="autoFocus"
        v-model.trim="value"
        :placeholder="placeholder"
        :type="type"
        :class="classes"
    />

    <small
        class="text-danger italic font-semibold max-w-[205px]"
        v-if="!!error"
    >
        {{ error }}
    </small>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
    class?: string;
    type?: 'text';
    placeholder?: string;
    modelValue?: string;
    error?: string | null;
    autoFocus?: boolean;
}

interface Events {
    (e: 'update:modelValue', value: string): void;
}

const props = withDefaults(defineProps<Props>(), {
    class: '',
    type: 'text',
    modelValue: '',
    autoFocus: false
});

const emit = defineEmits<Events>();

const value = computed<string>({
    get() {
        return props.modelValue;
    },
    set(value) {
        emit('update:modelValue', value);
    }
});

const classes = computed(() => {
    return {
        'border-red-500': !!props.error,
        'border-gray-500': !props.error,
        'placeholder:text-secondary/50 placeholder:font-thin': true,
        'font-bold border-secondary bg-darker border p-2 rounded-md': true,
        'focus:outline-none focus:ring-2 focus:ring-primary': true,
        'focus:ring-danger border-danger': !!props.error,
        [props.class]: true
    };
});
</script>
