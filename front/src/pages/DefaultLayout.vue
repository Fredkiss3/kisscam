<template>
    <Header />

    <main class="h-[80vh] flex flex-col items-center justify-center gap-4 p-8">
        <router-view></router-view>
    </main>

    <Footer />
</template>
<script setup lang="ts">
import Footer from '../components/Footer.vue';
import Header from '../components/Header.vue';
</script>
