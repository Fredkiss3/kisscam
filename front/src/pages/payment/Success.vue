<template>
    <h1 class="font-bold text-4xl">You payment has been successful</h1>
    <p class="text-lg">You can now access to all of KISS-CAM features</p>

    <router-link to="/" class="flex gap-2 items-center underline">
        <ArrowLeftIcon class="h-4" />
        Go Home
    </router-link>
</template>
<script setup lang="ts">
import { ArrowLeftIcon } from '@heroicons/vue/solid';
</script>
