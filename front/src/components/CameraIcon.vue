<template>
    <svg
        xmlns="http://www.w3.org/2000/svg"
        :class="class"
        fill="currentColor"
        viewBox="0 0 256 256"
    >
        <rect width="256" height="256" fill="none"></rect>
        <path
            d="M176,92v96a16,16,0,0,1-16,16H48A40,40,0,0,1,8,164V68A16,16,0,0,1,24,52H136A40,40,0,0,1,176,92Zm68-18.9a7.7,7.7,0,0,0-8,0L196,95.9a8,8,0,0,0-4,7v50.2a8,8,0,0,0,4,7l40,22.8a8.3,8.3,0,0,0,4,1.1,8,8,0,0,0,4-1.1,7.8,7.8,0,0,0,4-6.9V80A7.8,7.8,0,0,0,244,73.1Z"
        ></path>
    </svg>
</template>

<script setup lang="ts">
interface Props {
    class?: string;
}

defineProps<Props>();
</script>
