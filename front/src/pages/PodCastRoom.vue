<template>
    <NotFound
        v-if="store.currentStep === 'ROOM_NOT_FOUND'"
        message="Room not found"
    />

    <div
        v-else-if="store.currentStep === 'ROOM_JOINED'"
        class="min-h-[100vh] items-center justify-center m-auto px-10 pt-28 pb-10 w-full grid grid-cols-10 gap-6"
    >
        <div class="flex flex-col gap-6 col-span-6 items-start w-full h-full">
            <ControlsPanel variant="simple" />

            <div
                class="grid grid-cols-2 gap-6 w-full place-content-center place-items-center"
            >
                <VideoCard
                    name="You"
                    :is-me="true"
                    :video-src="store.user.stream ?? null"
                    :client-id="store.user.id!"
                    :is-host="
                        store.user.twitchUserName === store.room.twitchHostName
                    "
                    :peeps-no="randomInt(1, 105)"
                    :muted="true"
                    :fixedWidth="false"
                    :video-activated="store.user.videoActivated"
                />

                <VideoCard
                    v-for="(client, index) in clients"
                    :key="client.id"
                    :class="`${
                        Object.keys(store.room.clients).length % 2 === 0 &&
                        index === Object.keys(store.room.clients).length - 1
                            ? 'col-span-2'
                            : 'col-span-1'
                    }`"
                    :fixedWidth="false"
                    :name="client.clientName"
                    :client-id="client.id"
                    :peeps-no="client.peepNo"
                    :is-host="client.isHost"
                    :video-src="store.peers[client.id]?.stream ?? null"
                    :muted="!store.room.clients[client.id].audioActivated"
                    :video-activated="
                        store.room.clients[client.id].videoActivated
                    "
                    @copy-embed="copyEmbedLinkToClipboard(client.id)"
                />
            </div>
        </div>

        <div
            class="flex flex-col justify-start items-end h-full col-span-4 pl-10 gap-6"
        >
            <ChatTitlePanel class="h-[75px]" />

            <iframe
                :src="`https://prettych.at/chat?username=${store.room.twitchHostName}&theme=Will`"
                frameborder="0"
                class="w-full h-full"
            />
        </div>
    </div>

    <div v-else class="flex gap-2 items-center justify-center h-screen w-full">
        <Loader />
        <h2>Connecting to the room...</h2>
    </div>
</template>

<script setup lang="ts">
// components
import NotFound from '../pages/NotFound.vue';
import Loader from '../components/Loader.vue';
import VideoCard from '../components/VideoCard.vue';
import ControlsPanel from '../components/ControlsPanel.vue';
import ChatTitlePanel from '../components/ChatTitlePanel.vue';

// utils & functions
import { computed, onMounted, onUnmounted } from 'vue';
import { randomInt, gotoHashURL } from '../lib/functions';
import { useStore } from '../lib/store';
import { useRoute, useRouter } from 'vue-router';

const router = useRouter();
const route = useRoute();

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
});

onMounted(async () => {
    if (!store.user.name) {
        router.push({
            name: 'join-pod-room',
            query: {
                roomId: route.params.roomId,
            },
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
                id: route.params.roomId as string,
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
        router.push({
            name: 'join-pod-room',
            query: {
                roomId: route.params.roomId,
            },
        });
    }
});

onUnmounted(() => {
    store.leaveRoom();
});

async function copyEmbedLinkToClipboard(id: string) {
    const embedLink = `${window.location.origin}/embed/${route.params.roomId}/${id}`;
    await navigator.clipboard.writeText(embedLink);
    alert('The embed link has been copied to your clipboard');
}
</script>
