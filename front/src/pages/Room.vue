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
                :video-src="store.user.stream ?? null"
                :client-id="store.user.id!"
                :peeps-no="randomInt(1, 105)"
                :muted="true"
                :video-activated="store.user.videoActivated"
            />

            <!-- v-if="client." -->
            <VideoCard
                v-for="client in clients"
                :key="client.id"
                :name="client.clientName"
                :client-id="client.id"
                :peeps-no="client.peepNo"
                :video-src="store.peers[client.id]?.stream ?? null"
                :muted="!store.room.clients[client.id].audioActivated"
                :video-activated="store.room.clients[client.id].videoActivated"
                @copy-embed="copyEmbedLinkToClipboard(client.id)"
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
import { computed, onMounted, onUnmounted, watchEffect } from 'vue';
import { randomInt, gotoHashURL } from '../lib/functions';
import { useStore } from '../lib/store';

// components
import NotFound from '../pages/NotFound.vue';
import Loader from '../components/Loader.vue';
import VideoCard from '../components/VideoCard.vue';
import ControlsPanel from '../components/ControlsPanel.vue';

const store = useStore();

watchEffect(() => {
    console.log({
        clients: store.room.clients,
    });
});

const clients = computed(() => {
    return Object.entries(store.room.clients)
        .filter(([_, client]) => {
            return !client.isEmbed;
        })
        .map(([id, client]) => ({
            id,
            ...client,
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
            'room-id': hashFromID.value,
        });
        alert(`You must set a username before joining a room`);
        return;
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
        });

        if (stream) {
            store.user.stream = stream;
            store.joinRoom({
                id: hashFromID.value,
                username: store.user.name,
            });
        } else {
            alert(
                'You must allow access to your camera and microphone to join a room'
            );
        }
    } catch (error) {
        console.error(error);

        alert(
            'You must allow access to your camera and microphone to join a room'
        );
        gotoHashURL('/join-room', {
            'room-id': hashFromID.value,
        });
    }
});

async function copyEmbedLinkToClipboard(id: string) {
    const embedLink = `${window.location.origin}/#/embed/${hashFromID.value}/${id}`;
    console.log({ embedLink });

    await navigator.clipboard.writeText(embedLink);
    alert('The embed link has been copied to your clipboard');
}

onUnmounted(() => {
    store.leaveRoom();
});
</script>
