<template>
    <svg
        xmlns="http://www.w3.org/2000/svg"
        :class="class"
        fill="currentColor"
        viewBox="0 0 256 256"
    >
        <rect width="256" height="256" fill="none"></rect>
        <path
            d="M128,128h88a88.1,88.1,0,1,1-25.8-62.2"
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="24"
        ></path>
    </svg>
</template>
<script setup lang="ts">
interface Props {
    class?: string;
}

defineProps<Props>();
</script>
