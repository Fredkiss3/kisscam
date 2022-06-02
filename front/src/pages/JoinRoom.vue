<template>
    <div class="h-screen flex flex-col items-center justify-center gap-4">
        <h1 class="font-bold text-4xl">Join a room</h1>

        <form
            @submit.prevent="joinRoom(data.roomId, data.name)"
            class="flex flex-col gap-2"
        >
            <Input v-model="data.roomId" type="text" placeholder="Room ID" />
            <Input v-model="data.name" type="text" placeholder="Your name" />
            <Button
                :disabled="data.roomId.length === 0 || data.name.length === 0"
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

const { room, user, currentStep, joinRoom } = useStore();

// change the roomId when the user joins a room
watch(
    () => ({ currentStep, roomId: room.id }),
    ({ currentStep, roomId }) => {
        if (roomId && currentStep.value === 'JOINING_ROOM') {
            window.location.hash = `/room/${roomId}`;
        }
    }
);

const qs = new URLSearchParams(window.location.search);
const data = reactive({
    roomId: qs.get('room-id') || '',
    name: ''
});
</script>
