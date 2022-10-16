<template>
    <component :is="currentView" />

    <footer
        v-if="showFooter"
        class="fixed bottom-0 left-0 right-0 p-5 bg-dark flex items-center justify-between"
    >
        <div class="text-center">
            Copyright &copy; 2022 By
            <a
                target="_blank"
                href="https://fredkiss.dev"
                class="font-bold underline"
            >
                fredkiss3</a
            >
            Check out the source code on
            <a
                target="_blank"
                href="https://github.com/Fredkiss3/dpkiss-call"
                class="font-bold underline"
            >
                Github
            </a>
        </div>

        <Button class="" variant="hollow" @click="showFooter = false">
            Close Footer <XIcon class="h-4" />
        </Button>
    </footer>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

import Home from './pages/Home.vue';
import Room from './pages/Room.vue';
import JoinRoom from './pages/JoinRoom.vue';
import CreateRoom from './pages/CreateRoom.vue';
import NotFound from './pages/NotFound.vue';
import CreatePodCastRoom from './pages/CreatePodCastRoom.vue';
import PodCastRoom from './pages/PodCastRoom.vue';
import Button from './components/Button.vue';
import { XIcon } from '@heroicons/vue/solid';
import JoinPodRoom from './pages/JoinPodRoom.vue';
import Embed from './pages/Embed.vue';

const showFooter = ref(false);

/**
 * Route management
 */

const routes = {
    '/': Home,
    '/create-room': CreateRoom,
    '/create-podcast-room': CreatePodCastRoom,
    '/join-room': JoinRoom,
    '/join-pod-room': JoinPodRoom,
};
const currentPath = ref(window.location.hash);

window.addEventListener('hashchange', () => {
    currentPath.value = window.location.hash;
});

/**
 * Get the current route based on the path
 */
const currentView = computed(() => {
    const path = currentPath.value.slice(1) || '/';

    // check if path corresponds to a room
    const roomRegex = /\/room\/([a-z0-9]{10})$/;
    const podcastRoomRegex = /\/pod\/([a-z0-9]{10})$/;
    const embedRoomRegex = /\/embed\/([a-z0-9]{10})\/(.+)$/;

    if (roomRegex.test(path)) {
        return Room;
    } else if (podcastRoomRegex.test(path)) {
        return PodCastRoom;
    } else if (embedRoomRegex.test(path)) {
        return Embed;
    } else {
        // check if path corresponds to a route
        if (path in routes) {
            // @ts-ignore
            return routes[path];
        } else {
            return NotFound;
        }
    }
});
</script>
