<template>
    <div :class="classes">
        <div class="h-full self-stretch">
            <RssIcon class="-scale-x-100 text-danger h-6" />
        </div>
        <div class="flex flex-col">
            <h1 class="font-bold text-lg" v-if="variant === 'detailled'">
                You are in room: "{{ store.room.name }}"
            </h1>
            <h1 class="font-bold text-lg" v-else>
                {{ store.room.name }}
            </h1>

            <small class="text-secondary" v-if="variant === 'detailled'">
                {{
                    Object.keys(store.connectedClients).length > 0
                        ? `${
                              Object.keys(store.connectedClients).length
                          } together with you`
                        : 'No one is here but you'
                }}
            </small>
            <small class="text-secondary" v-else>
                {{ store.room.podTitle }}
            </small>
        </div>

        <div class="flex gap-2">
            <Button
                variant="hollow"
                class="p-3"
                is-square
                :title="
                    store.preferences.audioActivated
                        ? 'Mute yourself'
                        : 'Unmute yourself'
                "
                @click="store.toggleAudio()"
            >
                <MicIcon v-if="store.preferences.audioActivated" class="h-6" />
                <MutedMicIcon
                    v-if="!store.preferences.audioActivated"
                    class="h-6 text-secondary"
                />
            </Button>
            <Button
                variant="hollow"
                class="p-3"
                :disabled="!store.hasVideo"
                is-square
                :title="
                    !store.hasVideo
                        ? 'Video unavailable'
                        : store.preferences.videoActivated
                        ? 'Disable your camera'
                        : 'Enable your camera'
                "
                @click="store.toggleVideo()"
            >
                <CameraIcon
                    v-if="store.preferences.videoActivated || !store.hasVideo"
                    class="h-6 text-white"
                />
                <CameraOffIcon
                    v-else
                    class="h-6 text-secondary"
                />
            </Button>
        </div>

        <div class="flex gap-2">
            <Button
                title="Share your room link"
                variant="primary"
                class="p-3"
                is-square
                @click="copyRoomLinkToClipboard"
                v-if="variant === 'detailled'"
            >
                <ShareIcon class="h-6" />
            </Button>

            <Link
                variant="danger"
                square
                class="py-3 px-3"
                title="Exit Room"
                href="/"
            >
                <LogoutIcon class="h-6" />
            </Link>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from '../lib/pinia-store';
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
    variant?: 'simple' | 'detailled';
}

const props = withDefaults(defineProps<Props>(), {
    class: '',
    variant: 'detailled',
});

async function copyRoomLinkToClipboard() {
    const roomLink = window.location.href;
    await navigator.clipboard.writeText(roomLink);
    alert('The room link has been copied to your clipboard');
}

const classes = computed(() => {
    return {
        'border-secondary/50 bg-darker border p-3 rounded-2xl': true,
        'flex items-center gap-4': true,
        [props.class]: true,
    };
});
</script>
