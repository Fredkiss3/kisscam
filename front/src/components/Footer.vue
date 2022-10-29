<template>
    <footer
        v-if="showFooter"
        class="fixed bottom-0 left-0 right-0 p-2 bg-dark flex items-center justify-center"
    >
        <div class="text-center">
            Copyright &copy; {{ new Date().getFullYear() }} by

            <a target="_blank" href="https://fredkiss.dev">
                <span class="underline">Adrien KISSIE</span>
            </a>

            &nbsp;contact me at

            <a class="font-bold underline" href="mailto:contact@kiss-cam.live">
                contact@kiss-cam.live
            </a>
        </div>

        <Button
            class="absolute right-4 !p-1"
            variant="hollow"
            square
            @click="showFooter = false"
        >
            <XIcon class="h-4" />
        </Button>
    </footer>
</template>
<script setup lang="ts">
import { XIcon } from '@heroicons/vue/solid';
import { showFooter } from '../lib/composables';
import Button from './Button.vue';
</script>
