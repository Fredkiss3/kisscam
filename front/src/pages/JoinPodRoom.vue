<template>
    <div class="h-screen flex flex-col items-center justify-center gap-4">
        <h1 class="font-bold text-4xl">Join a Podcast room</h1>

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

        <router-link to="/dashboard" class="flex gap-2 items-center underline">
            <ArrowLeftIcon class="h-4" />
            Go back
        </router-link>
    </div>
</template>

<script setup lang="ts">
import Input from '../components/Input.vue';
import Button from '../components/Button.vue';
import { ArrowLeftIcon } from '@heroicons/vue/outline';

import { useStore } from '../lib/store';
import { reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const store = useStore();

const isLoading = ref(false);

const qs = new URLSearchParams(window.location.search);

const data = reactive({
    id: qs.get('roomId') || '',
    username: store.user.name,
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
        store.updateUserName({ username: data.username });
        router.push({
            name: 'podcast-room',
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
