<template>
    <div :class="classes.parent">
        <video
            :class="`rounded-lg h-full w-full object-cover object-center ${
                client && !client.videoActivated && 'hidden'
            }`"
            v-if="client && client.stream"
            ref="videoRef"
            autoplay
            muted="false"
            playinline
            playsinline
        />

        <div
            class="absolute inset-0 p-4 flex h-full w-full justify-center items-center"
        >
            <div
                :class="classes.img"
                v-if="client && (!client.stream || !client.videoActivated)"
            >
                <img
                    :src="`/Bust/peep-${client.peepNo}.png`"
                    alt="Your peep"
                    class="rounded-full h-full w-full object-cover object-center"
                />
            </div>

            <div
                class="rounded-full bg-dark h-40 w-40 flex items-center justify-center p-4"
                v-if="!client && store.currentStep !== 'JOINING_ROOM'"
            >
                <OfflineIcon class="rounded-full h-20 text-danger" />
            </div>

            <div v-if="!client && store.currentStep === 'JOINING_ROOM'">
                <Loader class="h-32 w-32" />
            </div>

            <div
                class="flex gap-2 items-center w-full absolute left-4 bottom-4"
                v-if="client && showUI && client.stream"
            >
                <Tag class="!px-2 !py-2">
                    <MicIcon
                        v-if="client.audioActivated"
                        class="text-white h-6"
                    />
                    <MutedMicIcon
                        v-if="!client.audioActivated"
                        class="text-danger h-6"
                    />
                </Tag>
                <Tag class="text-2xl">{{ client.clientName }}</Tag>
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
import OfflineIcon from '../components/OfflineIcon.vue';
import Loader from '../components/Loader.vue';
import Tag from '../components/Tag.vue';
import MutedMicIcon from '../components/MutedMicIcon.vue';
import MicIcon from '../components/MicIcon.vue';

import { computed, onMounted, onUnmounted, ref, watch, watchEffect } from 'vue';
import { useStore } from '../lib/pinia-store';
import { useRoute } from 'vue-router';
import Button from '../components/Button.vue';

const qs = new URLSearchParams(window.location.search);
const showUI = ref(!!qs.get('showUI'));
const route = useRoute();

const classes = computed(() => {
    return {
        parent: {
            'rounded-lg relative bg-hollow h-screen w-screen': true,
        },
        img: {
            'rounded-full bg-dark h-40 w-40': true,
        },
    };
});

/**
 * Store logic to enable embed
 */
const store = useStore();

const client = computed(() => {
    const filteredClient =
        store.room.clients[store.preferences.embbededClientUid!];

    return filteredClient
        ? {
              ...filteredClient,
              stream: store.peers[store.preferences.embbededClientUid!]?.stream,
          }
        : null;
});

const videoRef = ref<HTMLVideoElement | null>(null);

watchEffect(async () => {
    // Automatically play the video when the source the audio or video is loaded.
    if (client.value && videoRef.value && client.value.stream) {
        videoRef.value.srcObject = client.value.stream;
        videoRef.value.play();
    }
});

watch(
    () => store.isSocketReady,
    () => {
        if (store.isSocketReady) {
            joinRoom();
        }
    }
);

function joinRoom() {
    const userId = qs.get('userID');
    const embeddedUserId = qs.get('embeddedUserID');

    if (userId !== null && embeddedUserId !== null) {
        store.joinRoom({
            id: route.params.roomId as string,
            username: `embed-${route.params.roomId}`,
            isEmbed: true,
            userId,
            embbededClientUid: embeddedUserId,
        });
    }
}

onUnmounted(() => {
    store.leaveRoom();
});
</script>
