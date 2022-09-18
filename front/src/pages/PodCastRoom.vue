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
                    v-for="(client, clientId, index) in store.room.clients"
                    :key="clientId"
                    :class="`${
                        Object.keys(store.room.clients).length % 2 === 0 &&
                        index === Object.keys(store.room.clients).length - 1
                            ? 'col-span-2'
                            : 'col-span-1'
                    }`"
                    :fixedWidth="false"
                    :name="client.clientName"
                    :client-id="clientId"
                    :peeps-no="client.peepNo"
                    :is-host="client.isHost"
                    :video-src="store.peers[clientId]?.stream ?? null"
                    :muted="!store.room.clients[clientId].audioActivated"
                    :video-activated="
                        store.room.clients[clientId].videoActivated
                    "
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
// utils & functions
import { computed, onMounted, onUnmounted } from 'vue';
import { randomInt, gotoHashURL } from '../lib/functions';
import { useStore } from '../lib/store';

// components
import NotFound from '../pages/NotFound.vue';
import Loader from '../components/Loader.vue';
import VideoCard from '../components/VideoCard.vue';
import ControlsPanel from '../components/ControlsPanel.vue';
import ChatTitlePanel from '../components/ChatTitlePanel.vue';

const store = useStore();

const hashFromID = computed(() => {
    const podRegex = /\/pod\/([a-z0-9]{10})$/;
    const hash = window.location.hash;
    return hash.match(podRegex)![1];
});

onMounted(async () => {
    if (!store.user.name) {
        gotoHashURL('/join-pod-room', {
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
        gotoHashURL('/join-pod-room', {
            'room-id': hashFromID.value,
        });
    }
});

onUnmounted(() => {
    store.leaveRoom();
});

/**
 * https://prettych.at/chat?username=fredkisss&theme=Will
 */
</script>
