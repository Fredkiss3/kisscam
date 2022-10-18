<template>
    <div class="h-screen flex flex-col items-center justify-center gap-4">
        <div class="flex flex-col gap-4 items-center" v-if="!isLoading">
            <h1 class="font-bold text-4xl">KISS-CAM ❤️📸</h1>
            <Link href="/create-podcast-room" variant="danger">
                Create a podcast Room <MicrophoneIcon class="h-4" />
            </Link>
            <Link href="/create-room">
                Create a Room <PlusIcon class="h-4" />
            </Link>
            <Link href="/join-room" variant="hollow">
                Join a Room <ArrowRightIcon class="h-4" />
            </Link>
        </div>

        <div
            v-else
            class="flex gap-2 items-center justify-center h-screen w-full"
        >
            <Loader />
            <h2>Checking user session...</h2>
        </div>
    </div>
</template>

<script setup lang="ts">
import Link from '../components/Link.vue';
import { ArrowRightIcon, PlusIcon, MicrophoneIcon } from '@heroicons/vue/solid';
import { useAuthedSession } from '../lib/use-auth';
import Loader from '../components/Loader.vue';

const { isLoading } = useAuthedSession();
</script>
