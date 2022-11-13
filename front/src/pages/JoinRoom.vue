<template>
    <div class="h-screen flex flex-col items-center justify-center gap-4">
        <div
            class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-44 w-44 rounded-full bg-purple-500 blur-[200px] z-[-1]"
        ></div>
        <h1 class="font-bold text-4xl">Join a room</h1>

        <form @submit.prevent="handleSubmit" class="flex flex-col gap-2">
            <Input
                v-model="data.id"
                type="text"
                placeholder="Room ID"
                :error="data.errorOnID"
                class=""
            />
            <Input
                v-model="data.username"
                type="text"
                placeholder="Your name"
            />
            <Button
                :disabled="
                    data.id.length === 0 ||
                    data.username.length === 0 ||
                    !!data.errorOnID
                "
                :loading="isLoading"
            >
                Join
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

import { useStore } from '../lib/pinia-store';
import { reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const store = useStore();

const isLoading = ref(false);

const qs = new URLSearchParams(window.location.search);

const data = reactive({
    id: qs.get('roomId') || '',
    username: store.preferences.username ?? '',
    errorOnID: null as string | null,
});

watch(
    () => data.id,
    () => {
        data.errorOnID = null;
    }
);

function handleSubmit() {
    isLoading.value = true;

    const roomIDRegex = /^([a-z0-9]{10})$/;

    if (roomIDRegex.test(data.id)) {
        store.preferences.username = data.username;
        store.saveUserPreferences();
        router.push({
            name: 'call-room',
            params: {
                roomId: data.id,
            },
        });
    } else {
        data.errorOnID =
            'Invalid room ID, it should be an 10 characters long alphanumeric string, ex: abcdef1234';
    }
    isLoading.value = false;
}
</script>
