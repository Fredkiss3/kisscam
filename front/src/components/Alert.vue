<template>
    <div
        :class="[
            'border-red-500 border bg-red-100 text-red-500 p-4 rounded-md font-semibold',
            props.class,
        ]"
    >
        <slot></slot>
    </div>
</template>
<script setup lang="ts">
interface Props {
    class?: string;
}

const props = defineProps<Props>();
</script>
