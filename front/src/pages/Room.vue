<template>
    <pre>{{ clientPeers }}</pre>
    <pre>{{ store.peers }}</pre>
    <div
        v-if="store.currentStep === 'JOINING_ROOM'"
        class="flex gap-2 items-center justify-center h-screen w-full"
    >
        <Loader />

        <h2>Connecting to the room...</h2>
    </div>

    <div
        v-else-if="store.currentStep === 'ROOM_JOINED'"
        class="h-screen flex flex-col items-center justify-center gap-4 p-4 max-w-[1200px] m-auto"
    >
        <h1 class="font-bold text-4xl">
            You are in room {{ store.room.name }}
        </h1>

        <div class="flex flex-wrap gap-6 justify-center">
            <VideoCard
                name="You"
                :video-src="store.user.stream"
                :client-id="store.user.id!"
                :peeps-no="randomInt(1, 105)"
                :audio-active="false"
            />

            <VideoCard
                v-for="(client, clientId) in store.room.clients"
                :key="clientId"
                :name="client.clientName"
                :client-id="clientId"
                :peeps-no="client.peepNo"
                :video-src="client.stream"
                :audio-active="!!client.stream"
            />
        </div>
    </div>

    <NotFound v-else message="Room not found" />
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue';
import NotFound from '../pages/NotFound.vue';
import { randomInt } from '../lib/functions';
import { useStore } from '../lib/store';
import Loader from '../components/Loader.vue';
import { gotoHashURL } from '../lib/functions';
import VideoCard from '../components/VideoCard.vue';

const store = useStore();

const clientPeers = computed(() => {
    return Object.entries(store.peers)
        .filter(([id, peer]) => !!peer.clientId)
        .map(([id, peer]) => ({
            id,
            ...(peer.clientId ? store.room.clients[peer.clientId] : {})
        }));
});

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
    }

    store.joinRoom({
        id: hashFromID.value,
        username: store.user.name
    });
});

onUnmounted(() => {
    store.leaveRoom();
});
</script>
