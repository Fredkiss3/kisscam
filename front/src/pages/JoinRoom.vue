<template>
    <div class="h-screen flex flex-col items-center justify-center gap-4">
        <h1 class="font-bold text-4xl">Join a room</h1>

        <form
            @submit.prevent="store.joinRoom(data)"
            class="flex flex-col gap-2"
        >
            <Input v-model="data.id" type="text" placeholder="Room ID" />
            <Input
                v-model="data.username"
                type="text"
                placeholder="Your name"
            />
            <Button
                :disabled="data.id.length === 0 || data.username.length === 0"
            >
                Join
            </Button>
        </form>

        <a href="#/" class="flex gap-2 items-center underline">
            <ArrowLeftIcon class="h-4" />
            Go back
        </a>
    </div>
</template>

<script setup lang="ts">
import Input from '../components/Input.vue';
import Button from '../components/Button.vue';

import { ArrowLeftIcon } from '@heroicons/vue/outline';
import { useStore } from '../lib/store';
import { reactive, watch } from 'vue';

const store = useStore();

// change the roomId when the user joins a room
watch(
    () => ({ currentStep: store.currentStep, roomId: store.room.id }),
    ({ currentStep, roomId }) => {
        if (roomId && currentStep === 'JOINING_ROOM') {
            window.location.hash = `/room/${roomId}`;
        }
    }
);

const qs = new URLSearchParams(window.location.search);
const data = reactive({
    id: qs.get('room-id') || '',
    username: store.user.name
});
</script>
