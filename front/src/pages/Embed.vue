<template>
    <div :class="classes.parent">
        <video
            :class="`rounded-lg h-full w-full object-cover object-center ${
                !client.videoActivated && 'hidden'
            }`"
            v-if="client.stream"
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
                v-if="!client.stream || !client.videoActivated"
            >
                <img
                    :src="`/Bust/peep-${client.peepNo}.png`"
                    alt="Your peep"
                    class="rounded-full h-full w-full object-cover object-center tranform"
                />
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watchEffect } from 'vue';
import { useStore } from '../lib/store';

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
    const one = store.room.clients[store.user.idToFilter!];

    return {
        ...one,
        stream: store.peers[store.user.idToFilter!]?.stream,
    };
});

const videoRef = ref<HTMLVideoElement | null>(null);

watchEffect(async () => {
    if (videoRef.value && client.value.stream) {
        videoRef.value.srcObject = client.value.stream;
        videoRef.value.play();
    }
});

// Automatically play the video when the source the audio or video is loaded.
const hashFromID = computed(() => {
    const embedRoomRegex = /\/embed\/([a-z0-9]{10})\/(.+)$/;
    const hash = window.location.hash;
    const [_, ...matches] = hash.match(embedRoomRegex)!;
    return matches;
});

onMounted(async () => {
    console.log({ hashFromID: hashFromID.value });
    const [roomId, cliendId] = hashFromID.value;

    store.joinRoom({
        id: roomId,
        username: `embed-${hashFromID.value}`,
        embed: true,
        filter: cliendId,
    });
});
onUnmounted(() => {
    store.leaveRoom();
});
</script>
