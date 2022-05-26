<template>
    <div class="h-screen flex flex-col items-center justify-center gap-4">
        <h1 class="font-bold text-4xl">Join a room</h1>

        <form @submit.prevent="joinRoom" class="flex flex-col gap-2">
            <Input v-model="roomId" type="text" placeholder="Room ID" />
            <Button :disabled="roomId.length === 0"> Join </Button>
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
import { ref } from 'vue';

function joinRoom() {
    console.log('joining room with: ', roomId);
}

const roomId = ref('');
</script>
