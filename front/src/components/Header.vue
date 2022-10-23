<template>
    <header
        class="flex p-4 justify-between items-center bg-hollow"
        v-if="!isLoading"
    >
        <router-link to="/dashboard">
            <img src="/logo-dark-text.svg" alt="KISSCAM's Logo" class="h-10" />
        </router-link>

        <div class="flex gap-4 font-bold items-center">
            <Menu v-if="user">
                <template v-slot:content>
                    <div class="flex items-center gap-2">
                        <img
                            :src="user.user_metadata.avatar_url"
                            alt="user's avatar"
                            class="h-8 w-8 object-contain object-center rounded-full"
                        />
                        <span>{{ user.user_metadata.name }}</span>

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
                                @click="createPortalSession"
                                :class="[
                                    active
                                        ? 'bg-purple-500 text-white'
                                        : 'text-white',
                                    'group flex w-full items-center rounded-md px-2 py-2 text-sm gap-2',
                                ]"
                            >
                                <CogIcon class="h-6" />
                                Subscription settings
                            </button>
                        </MenuItem>

                        <MenuItem v-slot="{ active }">
                            <button
                                @click="logout.mutate"
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
                    </div>
                </template>
            </Menu>
        </div>
    </header>
</template>

<script setup lang="ts">
import Button from '../components/Button.vue';
import { LogoutIcon, CogIcon } from '@heroicons/vue/outline';
import { ChevronDownIcon } from '@heroicons/vue/solid';
import { MenuItem } from '@headlessui/vue';
import Menu from './Menu.vue';

import { jsonFetch } from '../lib/functions';
import { useLogoutMutation, useUserQuery } from '../lib/use-auth';

const { isLoading, data: user } = useUserQuery();
const logout = useLogoutMutation();

async function createPortalSession() {
    if (user.value) {
        const res = await jsonFetch<
            | { url: string; error: undefined }
            | { error: string; url: undefined }
        >(`//${import.meta.env.VITE_WS_URL}/api/create-portal-session`, {
            method: 'POST',
            body: JSON.stringify({
                uid: user.value.id,
            }),
        });

        if (res.error !== undefined) {
            console.log(res.error);
        } else {
            window.location.href = res.url;
        }
    }
}
</script>
