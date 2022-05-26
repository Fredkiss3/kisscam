<template>
  <div class="flex flex-col gap-2 items-center p-10">
    <component :is="currentView" />
  </div>
</template>


<script setup lang="ts">

import { ref, computed } from 'vue';
import Home from './pages/Home.vue';
import JoinRoom from './pages/JoinRoom.vue';
import CreateRoom from './pages/CreateRoom.vue';
import NotFound from './pages/NotFound.vue';

const routes = {
  '/': Home,
  '/create-room': CreateRoom,
  '/join-room': JoinRoom,
};

const currentPath = ref(window.location.hash);

window.addEventListener('hashchange', () => {
  currentPath.value = window.location.hash;
});

const currentView = computed(() => {
  // @ts-ignore
  return routes[currentPath.value.slice(1) || '/'] || NotFound;
});
</script>
