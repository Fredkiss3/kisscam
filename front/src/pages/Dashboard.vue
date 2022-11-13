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
        <!-- 
        <Card href="/create-room/podcast">
            <template v-slot:header>
                <span>Create a podcast Room </span>
                <MicrophoneIcon class="h-4" />
            </template>

            <template v-slot:default> Integrated with twitch </template>
        </Card> -->

        <Card href="/join/room">
            <template v-slot:header>
                <span>Join a Room </span>
                <ArrowRightIcon class="h-4" />
            </template>

            <template v-slot:default> Join a friend </template>
        </Card>
    </div>
    <div class="flex flex-col md:flex-row items-center gap-8" v-else>
        <Card href="/join/room">
            <template v-slot:header>
                <span>Join a Room </span>
                <ArrowRightIcon class="h-4" />
            </template>

            <template v-slot:default> Join a friend </template>
        </Card>

        <div class="flex flex-col items-start gap-4">
            <h1 class="text-xl font-bold text-left">
                Signup to create rooms and invite guests
            </h1>
            <Button
                @click="checkout.mutate"
                :loading="checkout.isLoading.value"
            >
                Start your 30 days free trial
            </Button>
            <div class="flex flex-col">
                <p class="">
                    <strong class="font-bold">No credit card required.</strong>
                    Feel free to resign if you think this is not made for you.
                </p>

                <p class="mt-4">
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
