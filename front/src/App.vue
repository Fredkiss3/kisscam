<template>
    <component :is="currentView" />

    <footer class="sticky bottom-0 left-0 right-0 text-center p-5 bg-dark">
        Copyright &copy; 2022 By
        <a
            target="_blank"
            href="https://fredkiss.dev"
            class="font-bold underline"
        >
            fredkiss3
        </a>
        Check out the source code on
        <a
            target="_blank"
            href="https://github.com/Fredkiss3/dpkiss-call"
            class="font-bold underline"
        >
            Github
        </a>
    </footer>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

import Home from './pages/Home.vue';
import Room from './pages/Room.vue';
import JoinRoom from './pages/JoinRoom.vue';
import CreateRoom from './pages/CreateRoom.vue';
import NotFound from './pages/NotFound.vue';

const routes = {
    '/': Home,
    '/create-room': CreateRoom,
    '/join-room': JoinRoom
};

const currentPath = ref(window.location.hash);

window.addEventListener('hashchange', () => {
    currentPath.value = window.location.hash;
});

const currentView = computed(() => {
    const path = currentPath.value.slice(1) || '/';

    // check if path corresponds to a room
    const roomRegex = /\/room\/([a-z0-9]{10})$/;

    if (roomRegex.test(path)) {
        return Room;
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
