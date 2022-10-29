<template>
    <h1 class="font-bold text-4xl">Sorry to see you go</h1>
    <p class="text-lg">We are always here if you change your mind 😉</p>

    <router-link to="/" class="flex gap-2 items-center underline">
        <ArrowLeftIcon class="h-4" />
        Go Home
    </router-link>
</template>
<script setup lang="ts">
import { ArrowLeftIcon } from '@heroicons/vue/solid';
</script>
