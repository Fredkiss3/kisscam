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
                :video-src="store.preferences?.stream ?? null"
                :client-id="store.user?.id!"
                :peeps-no="randomInt(1, 105)"
                :muted="true"
                :video-activated="store.preferences?.videoActivated"
            />

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

    <div
        v-else-if="store.currentStep === 'ROOM_ACCESS_DENIED'"
        class="flex flex-col gap-2 items-center justify-center h-screen w-full"
    >
        <h2 class="font-semibold text-2xl">ROOM ACCESS DENIED</h2>

        <p>The owner of the room refused your request to join the room.</p>

        <router-link to="/" class="flex gap-2 items-center underline">
            <ArrowLeftIcon class="h-4" />
            Go Home
        </router-link>
    </div>

    <div v-else class="flex gap-2 items-center justify-center h-screen w-full">
        <Loader />
        <h2>Connecting to the room...</h2>
    </div>
</template>

<script setup lang="ts">
// utils & functions
import { computed, onMounted, onUnmounted } from 'vue';
import { randomInt } from '../lib/functions';
import { useStore } from '../lib/pinia-store';

// components
import NotFound from '../pages/NotFound.vue';
import Loader from '../components/Loader.vue';
import VideoCard from '../components/VideoCard.vue';
import ControlsPanel from '../components/ControlsPanel.vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeftIcon } from '@heroicons/vue/outline';

const router = useRouter();
const route = useRoute();
console.log({
    route: {
        path: route.path,
        name: route.name,
    },
});

const store = useStore();

const clients = computed(() => {
    return Object.entries(store.room.clients)
        .filter(([_, client]) => {
            return !client.isEmbed;
        })
        .map(([id, client]) => ({
            id,
            ...client,
        }));

    return [];
});

onMounted(async () => {
    if (!store.preferences.username) {
        router.push({
            name: 'join-call-room',
            query: {
                roomId: route.params.roomId,
            },
        });
        alert(`Please set a username before joining a room`);
        return;
    }

    const stream = new MediaStream();
    try {
        const streamVideo = await navigator.mediaDevices.getUserMedia({
            video: true,
        });

        streamVideo.getTracks().forEach((track) => stream.addTrack(track));
    } catch (e) {
        // do nothing
        console.log('Video access denied');
    }

    // get audio
    try {
        const streamAudio = await navigator.mediaDevices.getUserMedia({
            audio: true,
        });
        streamAudio.getTracks().forEach((track) => stream.addTrack(track));

        if (streamAudio) {
            store.setStream(stream);
            store.joinRoom({
                id: route.params.roomId as string,
                username: store.preferences.username,
            });
        } else {
            alert(
                'You must allow access at least to your microphone to join a room'
            );
            router.push({
                name: 'join-call-room',
                query: {
                    roomId: route.params.roomId,
                },
            });
        }
    } catch (error) {
        alert(
            'You must allow access at least to your microphone to join a room'
        );
        router.push({
            name: 'join-call-room',
            query: {
                roomId: route.params.roomId,
            },
        });
    }
});

async function copyEmbedLinkToClipboard(id: string) {
    const embedLink = `${window.location.origin}/embed/${route.params.roomId}/${id}`;
    await navigator.clipboard.writeText(embedLink);
    alert('The embed link has been copied to your clipboard');
}

onUnmounted(() => {
    store.leaveRoom();
});
</script>
