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
    <component
        is="script"
        v-if="isPROD"
        async
        defer
        src='https://static.cloudflareinsights.com/beacon.min.js' 
        data-cf-beacon='{"token": "8a495778bcbd488ab65719ae13d706e9"}'
    ></component>
</template>

<script setup lang="ts">
// @ts-nocheck
const isPROD = import.meta.env.MODE !== 'development';
</script>
