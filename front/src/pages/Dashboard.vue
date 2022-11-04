<template>
    <div class="col-span-8">
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

            <Card href="/create-room/podcast">
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
            <Button
                @click="checkout.mutate"
                :loading="checkout.isLoading.value"
            >
                Start your 30 days free trial
            </Button>
            <div class="flex flex-col">
                <p class="text-center">
                    Try KISS-CAM for free for 30 days,
                    <strong class="font-bold"
                        >*no credit card required.*</strong
                    >
                </p>
                <p class="text-center">
                    Feel free to resign if you think this is not made for you.
                </p>

                <p class="text-center mt-4">
                    By signing up for KISS-CAM, you agree to
                    <router-link to="/tos" class="underline">
                        our terms of service</router-link
                    >.
                </p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
// components
import Card from '../components/Card.vue';
import Button from '../components/Button.vue';
import { ArrowRightIcon, PlusIcon, MicrophoneIcon } from '@heroicons/vue/solid';

// utils
import { useUserQuery, useCheckoutSessionMutation } from '../lib/composables';
import Sidebar from '../components/Sidebar.vue';

const { data: user } = useUserQuery();
const checkout = useCheckoutSessionMutation();
</script>
