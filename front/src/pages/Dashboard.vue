<template>
    <div
        class="flex flex-col items-center gap-4 md:flex-row"
        v-if="user?.subscribed_at !== null"
    >
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
    <div class="flex flex-col items-center gap-4" v-else>
        <h1 class="text-3xl font-bold">Signup to access all features</h1>
        <Button @click="checkout.mutate" :loading="checkout.isLoading.value">
            Start your free trial now
        </Button>
        <p class="text-center">
            Try KISS-CAM for free for 15 days. By signing up for KISS-CAM,
            <br />
            you agree to
            <router-link to="/tos" class="underline">
                our terms of service</router-link
            >.
        </p>
    </div>
</template>

<script setup lang="ts">
// components
import Card from '../components/Card.vue';
import Button from '../components/Button.vue';
import { ArrowRightIcon, PlusIcon, MicrophoneIcon } from '@heroicons/vue/solid';

// utils
import { useUserQuery, useCheckoutSessionMutation } from '../lib/composables';

const { data: user } = useUserQuery();
const checkout = useCheckoutSessionMutation(user.value);
</script>
