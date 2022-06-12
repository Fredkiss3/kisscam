<template>
    <div :class="classes">
        <RssIcon class="-scale-x-100 text-danger h-6" />
        <div class="flex flex-col">
            <h1 class="font-bold text-lg">
                You are in {{ store.room.name }} room
            </h1>

            <small class="text-secondary">
                {{
                    Object.keys(store.room.clients).length > 0
                        ? `${
                              Object.keys(store.room.clients).length
                          } together with you`
                        : 'No one is here but you'
                }}
            </small>
        </div>

        <div class="flex gap-2">
            <Button
                variant="hollow"
                class="p-3"
                square
                :title="
                    store.user.audioActivated
                        ? 'Mute yourself'
                        : 'Unmute yourself'
                "
                @click="store.toggleAudio()"
            >
                <MicIcon v-if="store.user.audioActivated" class="h-6" />
                <MutedMicIcon
                    v-if="!store.user.audioActivated"
                    class="h-6 text-secondary"
                />
            </Button>
            <Button
                variant="hollow"
                class="p-3"
                square
                :title="
                    store.user.videoActivated
                        ? 'Disable your camera'
                        : 'Enable your camera'
                "
                @click="store.toggleVideo()"
            >
                <CameraIcon v-if="store.user.videoActivated" class="h-6" />
                <CameraOffIcon
                    v-if="!store.user.videoActivated"
                    class="h-6 text-secondary"
                />
            </Button>
        </div>

        <div class="flex gap-2">
            <Button
                title="Share your room link"
                variant="primary"
                class="p-3"
                square
                @click="copyRoomLinkToClipboard"
            >
                <ShareIcon class="h-6" />
            </Button>

            <Link
                variant="danger"
                square
                class="py-3 px-3"
                title="Exit Room"
                href="#/"
            >
                <LogoutIcon class="h-6" />
            </Link>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from '../lib/store';
import { LogoutIcon } from '@heroicons/vue/outline';

import RssIcon from './RssIcon.vue';
import Button from './Button.vue';
import MicIcon from './MicIcon.vue';
import MutedMicIcon from './MutedMicIcon.vue';
import CameraIcon from './CameraIcon.vue';
import CameraOffIcon from './CameraOffIcon.vue';
import ShareIcon from './ShareIcon.vue';
import Link from './Link.vue';

const store = useStore();

interface Props {
    class?: string;
}

const props = withDefaults(defineProps<Props>(), {
    class: ''
});

async function copyRoomLinkToClipboard() {
    const roomLink = window.location.href;
    await navigator.clipboard.writeText(roomLink);
    alert('The room link has been copied to your clipboard');
}

const classes = computed(() => {
    return {
        'border-secondary/50 bg-darker border p-3 rounded-2xl': true,
        'flex items-stretch gap-4': true,
        // 'flex-col sm:flex-row': true,
        [props.class]: true
    };
});
</script>
