<template>
    <router-view />
    <component
        is="script"
        v-if="isPROD"
        async
        defer
        data-website-id="fc44ac46-b799-4d8c-b9a3-3cb36821b134"
        src="https://monitor.fredkiss.dev/umami.js"
    ></component>
</template>

<script setup lang="ts">
// @ts-ignore
const isPROD = import.meta.env.MODE !== 'development';
</script>
