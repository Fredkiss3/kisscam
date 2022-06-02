<template>
    <div class="h-screen flex flex-col items-center justify-center gap-4">
        <h1 class="font-bold text-4xl">Create a room</h1>

        <form @submit.prevent="createRoom(data)" class="flex flex-col gap-2">
            <Input
                v-model="data.username"
                type="text"
                placeholder="Your name"
            />
            <Input
                v-model="data.roomName"
                type="text"
                placeholder="Room name"
            />
            <Button
                :loading="currentStep === 'CREATING_ROOM'"
                :disabled="
                    data.roomName.length === 0 || data.username.length === 0
                "
            >
                {{
                    currentStep === 'CREATING_ROOM'
                        ? 'Creating the room'
                        : 'Create room'
                }}
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
import { reactive, watch } from 'vue';
import { useStore } from '../lib/store';

const { createRoom, currentStep, room } = useStore();

// change the roomId when the user joins a room
watch(
    () => ({ currentStep, roomId: room.id }),
    ({ currentStep, roomId }) => {
        if (roomId && currentStep.value === 'ROOM_CREATED') {
            window.location.hash = `/room/${roomId}`;
        }
    }
);

const data = reactive({
    username: '',
    roomName: ''
});
</script>
