<template>
    <div class="h-screen flex flex-col items-center justify-center gap-4">
        <h1 class="font-bold text-4xl">DPKISS-CALL</h1>
        <Link href="#/join-room">
            Join a Room <ArrowRightIcon class="h-4" />
        </Link>
        <Link href="#/create-room" variant="hollow">
            Create a Room <PlusIcon class="h-4" />
        </Link>
    </div>
</template>

<script setup lang="ts">
import Link from '../components/Link.vue';
</script>
