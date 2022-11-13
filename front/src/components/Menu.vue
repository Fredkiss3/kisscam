<template>
    <Menu as="div" :class="[`relative inline-block text-left`, props.class]">
        <div>
            <MenuButton
                :class="[
                    'inline-flex w-full justify-center bg-black bg-opacity-20 text-sm font-medium text-white',
                    'hover:bg-opacity-30',
                    !props.useSharpEdges ? 'rounded-md' : '',
                    !props.useSquareButton ? ' px-4 py-2' : 'p-2',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75',
                ]"
            >
                <slot name="content" />
            </MenuButton>
        </div>

        <transition
            enter-active-class="transition duration-100 ease-out"
            enter-from-class="transform scale-95 opacity-0"
            enter-to-class="transform scale-100 opacity-100"
            leave-active-class="transition duration-75 ease-in"
            leave-from-class="transform scale-100 opacity-100"
            leave-to-class="transform scale-95 opacity-0"
        >
            <MenuItems
                :class="[
                    props.size === 'large'
                        ? 'w-56'
                        : props.size === 'medium'
                        ? 'w-48'
                        : 'w-36',
                    props.alignment === 'left'
                        ? 'right-0  origin-top-right'
                        : 'left-0  origin-top-left',
                    'z-20 absolute mt-2 divide-y divide-gray-100 rounded-md bg-hollow shadow-lg ring-1 ring-white text-white ring-opacity-40 focus:outline-none',
                ]"
            >
                <slot name="items" />
            </MenuItems>
        </transition>
    </Menu>
</template>

<script setup lang="ts">
import { Menu, MenuButton, MenuItems } from '@headlessui/vue';

interface Props {
    class?: string;
    useSharpEdges?: boolean;
    useSquareButton?: boolean;
    size?: 'small' | 'medium' | 'large';
    alignment?: 'left' | 'right';
}

const props = withDefaults(defineProps<Props>(), {
    class: '',
    useSharpEdges: false,
    useSquareButton: false,
    size: 'large',
    alignment: 'left',
});
</script>
