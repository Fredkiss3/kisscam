<template>
    <div :class="classes.parent">
        <video
            class="rounded-lg h-full w-full object-cover object-center"
            v-if="videoSrc"
            ref="videoRef"
            autoplay
            :muted="true"
        />

        <div
            class="absolute inset-0 p-4 flex flex-col justify-between items-center"
        >
            <div class="flex justify-between w-full">
                <Button variant="dark" square @click="emit('pin', clientId)">
                    <PinFullIcon class="h-4 text-white" v-if="pinned" />
                    <PinIcon class="h-4 text-white" v-if="!pinned" />
                </Button>
                <Button variant="dark" square>
                    <DotsHorizontalIcon class="h-4" />
                </Button>
            </div>

            <div v-if="!videoSrc" :class="classes.img">
                <img
                    :src="`/Bust/peep-${peepsNo}.png`"
                    alt="You peeps"
                    class="rounded-full h-full w-full object-cover object-center tranform"
                />
            </div>

            <div class="flex gap-2 items-center w-full">
                <Tag class="!px-2 !py-2">
                    <MicIcon v-if="audioActive" class="text-white h-4" />
                    <MutedMicIcon v-if="!audioActive" class="text-danger h-4" />
                </Tag>
                <Tag>{{ name }}</Tag>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch, watchEffect } from 'vue';
import { randomInt } from '../lib/functions';
import { DotsHorizontalIcon } from '@heroicons/vue/outline';

import Tag from '../components/Tag.vue';
import Button from '../components/Button.vue';
import PinIcon from '../components/PinIcon.vue';
import PinFullIcon from '../components/PinFullIcon.vue';
import MutedMicIcon from '../components/MutedMicIcon.vue';
import MicIcon from '../components/MicIcon.vue';

interface Props {
    class?: string;
    name?: string;
    clientId: string;
    audioActive?: boolean;
    peepsNo?: number;
    talking?: boolean;
    pinned?: boolean;
    minimized?: boolean;
    videoSrc?: MediaStream | null;
}

interface Events {
    (e: 'pin', clientId: string): void;
}

const props = withDefaults(defineProps<Props>(), {
    class: '',
    audioActive: true,
    talking: false,
    peepsNo: randomInt(1, 105),
    pinned: false,
    minimized: false
});

const emit = defineEmits<Events>();

const classes = computed(() => {
    return {
        parent: {
            'rounded-lg relative bg-hollow h-[320px] w-[450px]': true,
            'border-2 border-primary': props.talking,
            [props.class]: true,
            'h-[200px] w-[250px]': props.minimized
        },
        img: {
            'rounded-full bg-dark': true,
            'h-40 w-40': !props.minimized,
            'h-20 w-20': props.minimized
        }
    };
});

const videoRef = ref<HTMLVideoElement | null>(null);

watchEffect(async () => {
    if (videoRef.value && props.videoSrc) {
        videoRef.value.srcObject = props.videoSrc;
    }
});
</script>
