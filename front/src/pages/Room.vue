<template>
    <div
        v-if="id"
        class="h-screen flex flex-col items-center justify-center gap-4 p-4 max-w-[1200px] m-auto"
    >
        <h1 class="font-bold text-4xl">You are in room {{ id }}</h1>

        <div class="flex gap-6 flex-col md:flex-row w-full">
            <!-- <div class=""> -->
            <VideoCard
                talking
                :pinned="currentPinnedId === 'randeowdwehf;lwrih'"
                audioActive
                name="Alan Becker"
                :peepsNo="peepsNo.second"
                peerId="randeowdwehf;lwrih"
                @pin="(peerId) => (currentPinnedId = peerId)"
                class="w-full md:h-[500px]"
            />
            <!-- </div> -->

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
            </div>
        </div>

        <Button @click="randomizePeeps">
            <span>Radomize Peeps</span> <RefreshIcon class="h-4" />
        </Button>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue';
import VideoCard from '../components/VideoCard.vue';
import NotFound from '../pages/NotFound.vue';
import Button from '../components/Button.vue';
import { randomInt } from '../lib/functions';
import { RefreshIcon } from '@heroicons/vue/outline';

const peepsNo = reactive({
    first: randomInt(1, 105),
    second: randomInt(1, 105)
});

function randomizePeeps() {
    peepsNo.first = randomInt(1, 105);
    peepsNo.second = randomInt(1, 105);
}

// get the roomId
const currentPinnedId = ref('');

const roomRegex = /\/room\/([a-z0-9]{10})/;

const id = computed(() => {
    const hash = window.location.hash;
    if (roomRegex.test(hash)) {
        // @ts-ignore
        return hash.match(roomRegex)[1];
    } else {
        return null;
    }
});
</script>
