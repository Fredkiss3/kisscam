<template>
    <div class="h-screen flex flex-col items-center justify-center gap-10">
        <h1 class="font-bold text-4xl">Login</h1>

        <div class="flex flex-col gap-4 items-stretch relative">
            <div
                class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-44 w-44 rounded-full bg-purple-500 blur-[200px] z-[-1]"
            ></div>

            <Button variant="purple" @click="loginWithOAuth('twitch')">
                Login with Twitch
                <TwitchLogoIcon class="h-4" />
            </Button>

            <Button variant="hollow" @click="loginWithOAuth('google')">
                Login with Google
                <GoogleLogoIcon class="h-4" />
            </Button>
        </div>
    </div>
</template>
<script setup lang="ts">
// components
import Button from '../components/Button.vue';
import GoogleLogoIcon from '../components/GoogleLogoIcon.vue';
import TwitchLogoIcon from '../components/TwitchLogoIcon.vue';

// utils
import { getHostWithScheme } from '../lib/functions';
import { supabase } from '../lib/supabase-client';

async function loginWithOAuth(provider: 'google' | 'twitch') {
    await supabase.auth.signInWithOAuth({
        provider,
        options: {
            redirectTo: `${getHostWithScheme(
                window.location.href
            )}/auth/callback`,
        },
    });
}
</script>
