<template>
    <NotFound
        v-if="store.currentStep === 'ROOM_NOT_FOUND'"
        message="Room not found"
    />

    <div
        v-else-if="store.currentStep === 'ROOM_JOINED'"
        :class="[
            'grid grid-cols-10 w-full pr-4',
            'h-full items-center justify-center gap-4 m-auto',
            'overflow-hidden',
        ]"
    >
        <div class="col-span-2 h-full" v-if="isHost()">
            <Sidebar />
        </div>
        <div
            :class="[
                isHost() ? 'col-span-8 ' : 'col-span-10',
                'flex flex-col gap-4 h-full py-9 px-4',
                'overflow-scroll',
            ]"
        >
            <ControlsPanel class="self-start" />

            <div
                class="flex flex-wrap gap-6 justify-around items-center flex-grow"
            >
                <VideoCard
                    name="You"
                    :is-me="true"
                    :video-src="store.preferences?.stream ?? null"
                    :client-id="store.user?.id!"
                    :peeps-no="randomInt(1, 105)"
                    :is-host="isHost()"
                    :muted="true"
                    :video-activated="store.preferences?.videoActivated"
                />

                <VideoCard
                    v-for="client in store.connectedClients"
                    :key="client.id"
                    :name="client.clientName"
                    :client-id="client.id"
                    :is-host="store.room.hostUid === client.id"
                    :peeps-no="client.peepNo"
                    :video-src="store.peers[client.id]?.stream ?? null"
                    :muted="!store.room.clients[client.id].audioActivated"
                    :video-activated="
                        store.room.clients[client.id].videoActivated
                    "
                    @copy-embed="copyEmbedLinkToClipboard(client.id)"
                />
            </div>
        </div>
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

    <div
        v-else-if="store.currentStep === 'ROOM_ACCESS_PENDING'"
        class="flex flex-col gap-2 items-center justify-center h-screen w-full"
    >
        <div class="flex gap-2 items-center justify-center">
            <Loader />
            <h2 class="font-semibold text-2xl">WAITING FOR ACCESS</h2>
        </div>

        <p>Your request has been sent to the owner.</p>
        <p>Please wait for the owner to give you access to the room.</p>

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
import { onMounted, onUnmounted } from 'vue';
import { randomInt } from '../lib/functions';
import { useStore } from '../lib/pinia-store';

// components
import NotFound from '../pages/NotFound.vue';
import Loader from '../components/Loader.vue';
import VideoCard from '../components/VideoCard.vue';
import ControlsPanel from '../components/ControlsPanel.vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeftIcon } from '@heroicons/vue/outline';
import Sidebar from '../components/Sidebar.vue';

const router = useRouter();
const route = useRoute();
const store = useStore();

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

function isHost() {
    return store.room.hostUid === store.user?.id;
}

async function copyEmbedLinkToClipboard(id: string) {
    const embedLink = `${window.location.origin}/embed/${route.params.roomId}/${id}`;
    await navigator.clipboard.writeText(embedLink);
    alert('The embed link has been copied to your clipboard');
}

onUnmounted(() => {
    store.leaveRoom();
});
</script>
