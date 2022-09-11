<template>
    <div class="h-screen flex flex-col items-center justify-center gap-4">
        <h1 class="font-bold text-4xl">Create a Podcast room</h1>

        <form @submit.prevent="createRoom(data)" class="flex flex-col gap-2">
            <Input
                v-model="data.username"
                type="text"
                placeholder="Your name"
            />
            <Input
                auto-focus
                v-model="data.roomName"
                type="text"
                placeholder="Room name"
            />
            <Input
                v-model="data.twitchHostName"
                type="text"
                placeholder="Twitch username"
            />
            <Input
                v-model="data.podTitle"
                type="text"
                placeholder="Podcast title"
            />
            <Button
                :loading="store.currentStep === 'CREATING_ROOM'"
                :disabled="
                    data.roomName.length === 0 ||
                    data.username.length === 0 ||
                    data.twitchHostName.length === 0
                "
            >
                {{
                    store.currentStep === 'CREATING_ROOM'
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

const store = useStore();

// change the roomId when the user joins a room
watch(
    () => ({ currentStep: store.currentStep, roomId: store.room.id }),
    ({ currentStep, roomId }) => {
        if (roomId && currentStep === 'ROOM_CREATED') {
            window.location.hash = `/pod/${roomId}`;
        }
    }
);

const data = reactive({
    username: store.user.name ?? '',
    roomName: '',
    twitchHostName: store.user.twitchUserName ?? '',
    podTitle: store.user.podTitle ?? '',
});

function createRoom(datas: typeof data) {
    store.createRoom(datas);
}
</script>
