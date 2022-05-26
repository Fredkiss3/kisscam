<template>
    <div class="h-screen flex flex-col items-center justify-center gap-4">
        <h1 class="font-bold text-4xl">Create a room</h1>

        <form @submit.prevent="joinRoom" class="flex flex-col gap-2">
            <Input v-model="data.name" type="text" placeholder="Your name" />
            <Input v-model="data.room" type="text" placeholder="Room name" />
            <Button
                :disabled="data.room.length === 0 || data.name.length === 0"
            >
                Create
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
import { ref, reactive } from 'vue';

function joinRoom() {
    console.log('joining room with: ', data);
}

const data = reactive({
    name: '',
    room: ''
});
</script>
