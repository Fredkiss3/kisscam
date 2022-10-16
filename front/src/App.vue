<template>
    <router-view />
    <component
        is="script"
        v-if="isPROD"
        async
        defer
        data-website-id="b609746d-2ca7-4be3-be87-cb1555ed2205"
        src="https://monitor.fredkiss.dev/umami.js"
    ></component>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const isPROD = ref(import.meta.env.MODE !== 'development');
</script>
