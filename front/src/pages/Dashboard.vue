<template>
    <div class="flex flex-col items-center gap-4 md:flex-row">
        <Card href="/create-room" is-cta>
            <template v-slot:header>
                <span>Create a Room</span>
                <PlusIcon class="h-4" />
            </template>

            <template v-slot:default> Invite people to your room </template>
        </Card>

        <Card href="/create-podcast-room">
            <template v-slot:header>
                <span>Create a podcast Room </span>
                <MicrophoneIcon class="h-4" />
            </template>

            <template v-slot:default> Integrated with twitch </template>
        </Card>

        <Card href="/join/room">
            <template v-slot:header>
                <span>Join a Room </span>
                <ArrowRightIcon class="h-4" />
            </template>

            <template v-slot:default> Join a friend </template>
        </Card>
    </div>
</template>

<script setup lang="ts">
import Card from '../components/Card.vue';
import { ArrowRightIcon, PlusIcon, MicrophoneIcon } from '@heroicons/vue/solid';

import { loadStripe } from '@stripe/stripe-js';
import { jsonFetch } from '../lib/functions';
import { ref } from 'vue';
import { useUserQuery } from '../lib/use-auth';

const { data: user } = useUserQuery();

const isLoadingStripeCheckout = ref<boolean>(false);

async function createCheckoutSession() {
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
</script>
