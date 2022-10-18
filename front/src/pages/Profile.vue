<template>
    <div class="flex flex-col gap-4 items-center" v-if="!isLoading">
        <h1 class="font-bold text-4xl">KISS-CAM ❤️📸</h1>

        <h2 class="font-bold text-2xl">Connected as :</h2>
        <div class="flex gap-4 font-bold items-center">
            <img
                :src="session?.user.user_metadata.avatar_url"
                alt="user's avatar"
                class="h-10 w-10 object-contain object-center"
            />
            <span>{{ session?.user.user_metadata.name }}</span>
            <Button variant="danger" @click="logout">
                Logout
                <LogoutIcon class="h-6" />
            </Button>
        </div>

        <Link href="/create-podcast-room" variant="purple">
            Create a podcast Room <MicrophoneIcon class="h-4" />
        </Link>
        <Link href="/create-room">
            Create a Room <PlusIcon class="h-4" />
        </Link>
        <Link href="/join-room" variant="hollow">
            Join a Room <ArrowRightIcon class="h-4" />
        </Link>
    </div>

    <div v-else class="flex gap-2 items-center justify-center h-screen w-full">
        <Loader class="h-14 w-14" />
        <h2 class="text-2xl font-bold">Checking if connected...</h2>
    </div>
</template>

<script setup lang="ts">
import Link from '../components/Link.vue';
import { ArrowRightIcon, PlusIcon, MicrophoneIcon } from '@heroicons/vue/solid';
import Loader from '../components/Loader.vue';
import Button from '../components/Button.vue';
import { LogoutIcon } from '@heroicons/vue/outline';

import { useAuthedSession } from '../lib/use-auth';

const { isLoading, session, logout } = useAuthedSession();
</script>
