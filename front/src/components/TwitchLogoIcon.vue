<template>
    <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
        :class="class"
        viewBox="0 0 256 256"
    >
        <rect width="256" height="256" fill="none"></rect>
        <path
            d="M165.1,200H122.9a7.8,7.8,0,0,0-5.1,1.9L72,240V200H48a8,8,0,0,1-8-8V48a8,8,0,0,1,8-8H208a8,8,0,0,1,8,8V156.3a8.1,8.1,0,0,1-2.9,6.1l-42.9,35.7A7.8,7.8,0,0,1,165.1,200Z"
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="24"
        ></path>
        <line
            x1="168"
            y1="88"
            x2="168"
            y2="136"
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="24"
        ></line>
        <line
            x1="120"
            y1="88"
            x2="120"
            y2="136"
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="24"
        ></line>
    </svg>
</template>
<script setup lang="ts">
interface Props {
    class?: string;
}

defineProps<Props>();
</script>
