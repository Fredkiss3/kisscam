<template>
    <input
        v-model.trim="value"
        :placeholder="placeholder"
        :type="type"
        :class="classes"
    />

    <p class="text-danger italic font-semibold" v-if="!!error">
        {{ error }}
    </p>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
    class?: string;
    type?: 'text';
    placeholder?: string;
    modelValue?: string;
    error?: string;
}

interface Events {
    (e: 'update:modelValue', value: string): void;
}

const props = withDefaults(defineProps<Props>(), {
    class: '',
    type: 'text',
    modelValue: ''
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
