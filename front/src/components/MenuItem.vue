<template>
    <MenuItem v-slot="{ active }">
        <slot :active="active" />
        <!-- <button
            :class="[
                active ? 'bg-violet-500 text-white' : 'text-gray-900',
                'group flex w-full items-center rounded-md px-2 py-2 text-sm',
            ]"
        >
            <DeleteIcon
                :active="active"
                class="mr-2 h-5 w-5 text-violet-400"
                aria-hidden="true"
            />
            Delete
        </button> -->
    </MenuItem>
</template>
<script lang="ts" setup>
import { MenuItem } from '@headlessui/vue';
</script>
