<template>
    <div
        v-if="currentStep === 'JOINING_ROOM'"
        class="flex gap-2 items-center justify-center h-screen w-full"
    >
        <Loader />

        <h2>Connecting to the room...</h2>
    </div>

    <div
        v-else-if="currentStep === 'ROOM_JOINED'"
        class="h-screen flex flex-col items-center justify-center gap-4 p-4 max-w-[1200px] m-auto"
    >
        <h1 class="font-bold text-4xl">You are in room {{ name }}</h1>

        <div class="flex gap-6 flex-col md:flex-row w-full">
            <!-- <VideoCard
                talking
                :pinned="currentPinnedId === 'randeowdwehf;lwrih'"
                audioActive
                name="Alan Becker"
                :peepsNo="peepsNo.second"
                peerId="randeowdwehf;lwrih"
                @pin="(peerId) => (currentPinnedId = peerId)"
                class="!w-full md:!h-[500px] max-w-[800px]"
            />

            <div class="flex flex-wrap gap-6 md:flex-col justify-center">
                <VideoCard
                    name="You"
                    minimized
                    :pinned="currentPinnedId === 'randeowdwehf;lwrihr'"
                    :peepsNo="peepsNo.first"
                    peerId="randeowdwehf;lwrihr"
                    @pin="(peerId) => (currentPinnedId = peerId)"
                    class="h-40 w-[225px]"
                />

                <VideoCard
                    name="You"
                    minimized
                    :pinned="currentPinnedId === 'randeowdwehf;lwrihrded'"
                    :peepsNo="peepsNo.first"
                    peerId="randeowdwehf;lwrihrded"
                    @pin="(peerId) => (currentPinnedId = peerId)"
                    class="h-40 w-[225px]"
                />
            </div> -->
        </div>

        <!-- <Button @click="randomizePeeps">
            <span>Radomize Peeps</span> <RefreshIcon class="h-4" />
        </Button> -->
    </div>

    <NotFound v-else message="Room not found" />
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import NotFound from '../pages/NotFound.vue';
// import Button from '../components/Button.vue';
// import { randomInt } from '../lib/functions';
// import { RefreshIcon } from '@heroicons/vue/outline';
import { useStore } from '../lib/store';
import Loader from '../components/Loader.vue';
import { gotoHashURL } from '../lib/functions';

const {
    user,
    joinRoom,
    room: { id, name },
    currentStep
} = useStore();

const hashFromID = computed(() => {
    const roomRegex = /\/room\/([a-z0-9]{10})$/;
    const hash = window.location.hash;
    return hash.match(roomRegex)![1];
});

onMounted(() => {
    if (!user.name) {
        // window.location.hash = `/join-room`;
        gotoHashURL('/join-room', {
            'room-id': hashFromID.value
        });
        alert(`You must set a username before joining a room`);
        return;
    }

    joinRoom(hashFromID.value, user.name);
});
</script>
