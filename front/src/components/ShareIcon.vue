<template>
    <svg
        xmlns="http://www.w3.org/2000/svg"
        :class="class"
        fill="currentColor"
        viewBox="0 0 256 256"
    >
        <rect width="256" height="256" fill="none"></rect>
        <path
            d="M176,160a39.7,39.7,0,0,0-28.6,12.1l-46.1-29.6a40.3,40.3,0,0,0,0-29l46.1-29.6A40,40,0,1,0,136,56a41,41,0,0,0,2.7,14.5L92.6,100.1a40,40,0,1,0,0,55.8l46.1,29.6A41,41,0,0,0,136,200a40,40,0,1,0,40-40Z"
        ></path>
    </svg>
</template>

<script setup lang="ts">
interface Props {
    class?: string;
}

defineProps<Props>();
</script>
