<template>
    <aside
        :class="[
            'h-full bg-hollow flex-col pb-4 justify-between items-start',
            'flex w-full',
            props.class,
        ]"
    >
        <div class="h-full bg-hollow flex flex-col pb-4 w-full">
            <div class="sticky top-0">
                <Menu class="w-full" use-squared-button size="small">
                    <template v-slot:content>
                        <div class="flex items-center gap-2">
                            <img
                                :src="user?.user_metadata.avatar_url"
                                alt="user's avatar"
                                class="h-8 w-8 object-contain object-center rounded-full"
                            />
                            <span>{{ user?.user_metadata.name }}</span>

                            <ChevronDownIcon
                                class="ml-2 -mr-1 h-5 w-5 text-violet-200 hover:text-violet-100"
                                aria-hidden="true"
                            />
                        </div>
                    </template>

                    <template v-slot:items>
                        <div class="px-1 py-1">
                            <MenuItem v-slot="{ active }">
                                <button
                                    @click="logout"
                                    :class="[
                                        active
                                            ? 'bg-purple-500 text-white'
                                            : 'text-white',
                                        'group flex w-full items-center rounded-md px-2 py-2 text-sm gap-2',
                                    ]"
                                >
                                    <LogoutIcon class="h-6" />
                                    Logout
                                </button>
                            </MenuItem>

                            <MenuItem v-slot="{ active }">
                                <router-link
                                    to="/"
                                    :class="[
                                        active
                                            ? 'bg-purple-500 text-white'
                                            : 'text-white',
                                        'group flex w-full items-center rounded-md px-2 py-2 text-sm gap-2',
                                    ]"
                                >
                                    <HomeIcon class="h-6" />
                                    Go Home
                                </router-link>
                            </MenuItem>
                        </div>
                    </template>
                </Menu>

                <nav class="w-full">
                    <div
                        class="w-full px-4 py-2 font-semibold bg-hollow-light flex justify-between items-center gap-2"
                    >
                        <span>In room</span>
                        <div class="opacity-50 flex gap-1 items-center">
                            <div><UsersIcon class="h-4 w-4" /></div>
                            <span>{{ store.connectedClients.length + 1 }}</span>
                        </div>
                    </div>

                    <ul class="pl-4 pr-2">
                        <li class="flex items-center gap-2 py-2">
                            <div class="bg-dark rounded-full">
                                <img
                                    :src="`/Bust/peep-${
                                        store.preferences.peepNo ?? 1
                                    }.png`"
                                    alt="profile photo"
                                    class="h-6 w-6 object-cover rounded-full"
                                />
                            </div>
                            <small class="font-semibold">{{
                                store.preferences.username
                            }}</small>

                            <small class="text-secondary font-bold"
                                >(You)</small
                            >
                        </li>

                        <li
                            class="flex items-center gap-2 py-2 justify-between"
                            v-for="client in store.connectedClients"
                        >
                            <div class="flex items-center gap-2">
                                <div class="bg-dark rounded-full">
                                    <img
                                        :src="`/Bust/peep-${
                                            store.preferences.peepNo ?? 1
                                        }.png`"
                                        alt="profile photo"
                                        class="h-6 w-6 object-cover rounded-full"
                                    />
                                </div>
                                <small class="font-semibold">{{
                                    client.clientName
                                }}</small>
                            </div>
                            <div class="flex items-center gap-2">
                                <Menu
                                    class="w-full"
                                    use-square-button
                                    size="medium"
                                >
                                    <template v-slot:content>
                                        <DotsHorizontalIcon class="h-4" />
                                    </template>

                                    <template v-slot:items>
                                        <div class="px-1 py-1">
                                            <MenuItem v-slot="{ active }">
                                                <button
                                                    :class="[
                                                        active
                                                            ? 'bg-purple-500 text-white'
                                                            : 'text-white',
                                                        'group flex w-full items-center rounded-md px-2 py-2 text-sm gap-2',
                                                    ]"
                                                >
                                                    <LinkIcon class="h-4" />
                                                    Copy embed
                                                </button>
                                            </MenuItem>
                                            <MenuItem v-slot="{ active }">
                                                <button
                                                    :class="[
                                                        active
                                                            ? 'bg-purple-500 text-white'
                                                            : 'text-white',
                                                        'group flex w-full items-center rounded-md px-2 py-2 text-sm gap-2',
                                                    ]"
                                                >
                                                    <LinkIcon class="h-4" />
                                                    Copy embed (with UI)
                                                </button>
                                            </MenuItem>
                                            <MenuItem v-slot="{ active }">
                                                <button
                                                    :class="[
                                                        active
                                                            ? 'bg-purple-500 text-white'
                                                            : 'text-white',
                                                        'group flex w-full items-center rounded-md px-2 py-2 text-sm gap-2',
                                                    ]"
                                                >
                                                    <BanIcon class="h-4" />
                                                    Kick User
                                                </button>
                                            </MenuItem>

                                            <MenuItem v-slot="{ active }">
                                                <button
                                                    to="/"
                                                    :class="[
                                                        active
                                                            ? 'bg-purple-500 text-white'
                                                            : 'text-white',
                                                        'group flex w-full items-center rounded-md px-2 py-2 text-sm gap-2',
                                                    ]"
                                                >
                                                    <MutedMicIcon
                                                        class="text-danger h-4"
                                                    />
                                                    Mute User
                                                </button>
                                            </MenuItem>
                                        </div>
                                    </template>
                                </Menu>
                            </div>
                        </li>
                    </ul>
                </nav>

                <nav class="mt-2">
                    <div
                        class="px-4 py-2 font-semibold bg-hollow-light flex justify-between items-center gap-2"
                    >
                        <span> Waiting list</span>
                        <div class="opacity-50 flex gap-1 items-center">
                            <div><UsersIcon class="h-4 w-4" /></div>
                            <span>{{ store.pendingClients.length }}</span>
                        </div>
                    </div>
                    <ul class="pl-4 pr-2">
                        <li
                            class="flex items-center gap-2 py-2 justify-between"
                            v-for="client in store.pendingClients"
                        >
                            <div class="flex items-center gap-2">
                                <div class="bg-dark rounded-full">
                                    <img
                                        src="/Bust/peep-4.png"
                                        alt="profile photo"
                                        class="h-6 w-6 object-cover rounded-full"
                                    />
                                </div>
                                <small class="font-semibold">{{
                                    client.clientName
                                }}</small>
                            </div>

                            <div class="flex gap-2 items-center">
                                <Button
                                    is-square
                                    variant="danger"
                                    title="Reject User"
                                >
                                    <XIcon class="h-4 w-4" />
                                </Button>
                                <Button
                                    is-square
                                    variant="dark"
                                    title="Accept user"
                                >
                                    <CheckIcon class="h-4 w-4" />
                                </Button>
                            </div>
                        </li>
                    </ul>
                </nav>
            </div>
        </div>
    </aside>
</template>

<script setup lang="ts">
import Menu from './Menu.vue';
import { MenuItem } from '@headlessui/vue';
import { useLogoutMutation, useUserQuery } from '../lib/composables';
import {
    HomeIcon,
    ChevronDownIcon,
    LogoutIcon,
    UsersIcon,
    BanIcon,
    CheckIcon,
    XIcon,
    LinkIcon,
} from '@heroicons/vue/outline';
import Button from './Button.vue';
import { DotsHorizontalIcon } from '@heroicons/vue/outline';
import MutedMicIcon from './MutedMicIcon.vue';
import { useStore } from '../lib/pinia-store';

interface Props {
    class?: string;
}

const props = withDefaults(defineProps<Props>(), {
    class: '',
});

const { data: user } = useUserQuery();
const store = useStore();

const logoutMutation = useLogoutMutation();
async function logout() {
    await logoutMutation.mutateAsync();
}
</script>
