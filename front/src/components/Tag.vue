<template>
    <small
        :class="`${props.class} py-1 px-3 bg-dark/70 rounded-md font-semibold`"
    >
        <slot />
    </small>
</template>

<script setup lang="ts">
interface Props {
    class?: string;
}

const props = withDefaults(defineProps<Props>(), {
    class: ''
});
</script>
