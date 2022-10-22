<template>
    <div class="flex flex-col gap-4 items-center" v-if="!isLoading">
        <h1 class="font-bold text-4xl">
            <img src="/logo-dark-text.svg" alt="KISSCAM's Logo" />
        </h1>

        <h2 class="font-bold text-2xl">Connected as :</h2>

        <div class="flex gap-4 font-bold items-center">
            <img
                :src="user?.user_metadata.avatar_url"
                alt="user's avatar"
                class="h-10 w-10 object-contain object-center"
            />
            <span>{{ user?.user_metadata.name }}</span>
            <Button variant="danger" @click="logout">
                Logout
                <LogoutIcon class="h-6" />
            </Button>
        </div>

        <div
            class="flex flex-col gap-4 items-center"
            v-if="user?.subscribed_at !== null"
        >
            <Link href="/create-podcast-room" variant="purple">
                Create a podcast Room <MicrophoneIcon class="h-4" />
            </Link>
            <Link href="/create-room">
                Create a Room <PlusIcon class="h-4" />
            </Link>
            <Link href="/join-room" variant="hollow">
                Join a Room <ArrowRightIcon class="h-4" />
            </Link>

            <button @click="createPortalSession" class="underline">
                Manage your subscription
            </button>
        </div>

        <div class="flex flex-col gap-2 items-center" v-else>
            <Button
                @click="createStripeSession"
                :loading="isLoadingStripeCheckout"
            >
                Start your free trial now
            </Button>
            <p class="text-center">
                Start your free 15-day trial. By signing up for KISS-CAM, <br />
                you agree to
                <router-link to="/tos" class="underline">
                    our terms of service </router-link
                >.
            </p>
        </div>
    </div>

    <div v-else class="flex gap-2 items-center justify-center h-screen w-full">
        <Loader class="h-14 w-14" />
        <h2 class="text-2xl font-bold">Checking if connected...</h2>
    </div>
</template>

<script setup lang="ts">
import Link from '../components/Link.vue';
import { ArrowRightIcon, PlusIcon, MicrophoneIcon } from '@heroicons/vue/solid';
import Loader from '../components/Loader.vue';
import Button from '../components/Button.vue';
import { LogoutIcon } from '@heroicons/vue/outline';

import { useAuthedUser } from '../lib/use-auth';
import { loadStripe } from '@stripe/stripe-js';
import { jsonFetch } from '../lib/functions';
import { ref } from 'vue';

const { isLoading, user, logout } = useAuthedUser();

const isLoadingStripeCheckout = ref<boolean>(false);

async function createStripeSession() {
    isLoadingStripeCheckout.value = true;

    const stripe = await loadStripe(
        // @ts-ignore
        import.meta.env.VITE_STRIPE_PUBLIC_KEY
    );

    if (stripe && user.value) {
        const res = await jsonFetch<
            { id: string; error: undefined } | { error: string; id: undefined }
        >(`//${import.meta.env.VITE_WS_URL}/api/create-checkout-session`, {
            method: 'POST',
            body: JSON.stringify({
                uid: user.value.id,
            }),
        });

        if (res.error !== undefined) {
            console.log(res.error);
        } else {
            await stripe.redirectToCheckout({
                sessionId: res.id,
            });
        }
    }

    isLoadingStripeCheckout.value = false;
}

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
