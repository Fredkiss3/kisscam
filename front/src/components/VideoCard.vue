<template>
    <div :class="classes.parent">
        <video
            :class="`rounded-lg h-full w-full object-cover object-center ${
                !videoActivated && 'hidden'
            }`"
            v-if="videoSrc"
            ref="videoRef"
            autoplay
            :muted="muted"
            playinline
            playsinline
        />

        <div
            class="absolute inset-0 p-4 flex flex-col justify-between items-center"
        >
            <div class="flex justify-end w-full">
                <Button variant="dark" is-square v-if="isHost">
                    <HomeIcon class="h-4 text-white" />
                </Button>
            </div>

            <div v-if="!videoSrc || !videoActivated" :class="classes.img">
                <img
                    :src="`/Bust/peep-${peepsNo}.png`"
                    alt="Your peep"
                    class="rounded-full h-full w-full object-cover object-center tranform"
                />
            </div>

            <div class="flex gap-2 items-center w-full">
                <Tag class="!px-2 !py-2" v-if="!isMe">
                    <MicIcon v-if="!muted" class="text-white h-4" />
                    <MutedMicIcon v-if="muted" class="text-danger h-4" />
                </Tag>
                <Tag>{{ name }}</Tag>
                <!-- <Button
                    variant="hollow"
                    is-square
                    @click="emit('copyEmbed')"
                    v-if="!isMe"
                >
                    <LinkIcon class="text-white h-4" />
                </Button> -->
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed, ref, watchEffect } from 'vue';
import { randomInt } from '../lib/functions';

// components
import Tag from '../components/Tag.vue';
import Button from '../components/Button.vue';
import MutedMicIcon from '../components/MutedMicIcon.vue';
import MicIcon from '../components/MicIcon.vue';
import { HomeIcon, LinkIcon } from '@heroicons/vue/solid';

interface Props {
    class?: string;
    name?: string;
    clientId: string;
    muted?: boolean;
    peepsNo?: number;
    talking?: boolean;
    minimized?: boolean;
    videoSrc?: MediaStream | null;
    isMe?: boolean;
    videoActivated?: boolean;
    fixedWidth?: boolean;
    isHost?: boolean;
}

interface Events {
    (e: 'copyEmbed'): void;
}

const props = withDefaults(defineProps<Props>(), {
    class: '',
    muted: false,
    talking: false,
    peepsNo: randomInt(1, 105),
    minimized: false,
    isMe: false,
    isHost: false,
    videoActivated: false,
    fixedWidth: true,
});

const emit = defineEmits<Events>();

const classes = computed(() => {
    return {
        parent: {
            'rounded-lg relative bg-hollow h-[320px] w-full max-w-[450px]':
                true,
            'border-2 border-primary': props.talking,
            [props.class]: true,
            'h-[200px] w-[250px]': props.minimized,
            'w-[450px]': props.fixedWidth,
        },
        img: {
            'rounded-full bg-dark': true,
            'h-40 w-40': !props.minimized,
            'h-20 w-20': props.minimized,
        },
    };
});

const videoRef = ref<HTMLVideoElement | null>(null);

watchEffect(async () => {
    if (videoRef.value && props.videoSrc) {
        videoRef.value.srcObject = props.videoSrc;
    }
});

// Automatically play the video when the source the audio or video is loaded.
watchEffect(async () => {
    if (videoRef.value && (!props.muted || props.videoActivated)) {
        videoRef.value.play();
    }
});
</script>
