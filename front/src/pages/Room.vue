<template>
    <NotFound
        v-if="store.currentStep === 'ROOM_NOT_FOUND'"
        message="Room not found"
    />

    <div
        v-else-if="store.currentStep === 'ROOM_JOINED'"
        class="min-h-[100vh] flex flex-col items-center justify-center gap-4 p-4 max-w-[1200px] m-auto py-10"
    >
        <div class="flex flex-wrap gap-6 justify-center">
            <VideoCard
                name="You"
                :is-me="true"
                :video-src="
                    store.user.videoActivated ? store.user.stream : null
                "
                :client-id="store.user.id!"
                :peeps-no="randomInt(1, 105)"
            />

            <VideoCard
                v-for="(client, clientId) in store.room.clients"
                :key="clientId"
                :name="client.clientName"
                :client-id="clientId"
                :peeps-no="client.peepNo"
                :video-src="
                    store.room.clients[clientId].videoActivated
                        ? store.peers[clientId]?.stream
                        : null
                "
                :muted="!store.room.clients[clientId].audioActivated"
            />
        </div>

        <ControlsPanel class="fixed bottom-24" />
    </div>

    <div v-else class="flex gap-2 items-center justify-center h-screen w-full">
        <Loader />
        <h2>Connecting to the room...</h2>
    </div>
</template>

<script setup lang="ts">
// utils & functions
import { computed, onMounted, onUnmounted } from 'vue';
import { randomInt, gotoHashURL } from '../lib/functions';
import { useStore } from '../lib/store';

// components
import NotFound from '../pages/NotFound.vue';
import Loader from '../components/Loader.vue';
import VideoCard from '../components/VideoCard.vue';
import ControlsPanel from '../components/ControlsPanel.vue';

const store = useStore();

const hashFromID = computed(() => {
    const roomRegex = /\/room\/([a-z0-9]{10})$/;
    const hash = window.location.hash;
    return hash.match(roomRegex)![1];
});

onMounted(async () => {
    if (!store.user.name) {
        gotoHashURL('/join-room', {
            'room-id': hashFromID.value
        });
        alert(`You must set a username before joining a room`);
        return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
    });

    if (stream) {
        store.user.stream = stream;
        store.joinRoom({
            id: hashFromID.value,
            username: store.user.name
        });
    } else {
        alert(
            'You must allow access to your camera and microphone to join a room'
        );
    }
});

onUnmounted(() => {
    store.leaveRoom();
});
</script>
