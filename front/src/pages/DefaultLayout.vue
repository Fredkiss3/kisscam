<template>
    <Header />

    <main class="h-[80vh] flex flex-col items-center justify-center gap-4 p-8">
        <router-view></router-view>
    </main>

    <footer
        class="fixed bottom-0 left-0 right-0 p-2 bg-dark flex items-center justify-center"
    >
        <div class="text-center">
            Copyright &copy; 2022 by
            <a target="_blank" href="https://fredkiss.dev" class="underline">
                Adrien KISSIE</a
            >
            contact me at
            <a class="font-bold underline" href="mailto:contact@kiss-cam.live"
                >contact@kiss-cam.live</a
            >
        </div>
    </footer>
</template>
<script setup lang="ts">
import Header from '../components/Header.vue';
</script>
