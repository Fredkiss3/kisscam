<template>
    <div class="h-screen flex flex-col items-center justify-center gap-4">
        <h1 class="font-bold text-4xl">Create a room</h1>

        <form
            @submit.prevent="store.createRoom(data)"
            class="flex flex-col gap-2"
        >
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
            <Button
                :loading="store.currentStep === 'CREATING_ROOM'"
                :disabled="
                    data.roomName.length === 0 || data.username.length === 0
                "
            >
                {{
                    store.currentStep === 'CREATING_ROOM'
                        ? 'Creating the room'
                        : 'Create room'
                }}
            </Button>
        </form>

        <router-link to="/" class="flex gap-2 items-center underline">
            <ArrowLeftIcon class="h-4" />
            Go back
        </router-link>
    </div>
</template>

<script setup lang="ts">
import Input from '../components/Input.vue';
import Button from '../components/Button.vue';
import { ArrowLeftIcon } from '@heroicons/vue/outline';

import { reactive, watch } from 'vue';
import { useStore } from '../lib/pinia-store';
import { useRouter } from 'vue-router';

const router = useRouter();

const store = useStore();

// change the roomId when the user joins a room
watch(
    () => ({ currentStep: store.currentStep, roomId: store.room?.id }),
    ({ currentStep, roomId }) => {
        if (roomId && currentStep === 'ROOM_CREATED') {
            router.push({
                name: 'call-room',
                params: {
                    roomId: roomId,
                },
            });
        }
    }
);

const data = reactive({
    username: store.preferences?.username ?? '',
    roomName: '',
});
</script>
