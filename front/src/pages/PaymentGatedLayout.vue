<template>
    <router-view></router-view>
</template>
<script setup lang="ts">
import { watchEffect } from 'vue';
import { useRouter } from 'vue-router';
import { useUserQuery } from '../lib/composables';

const { isLoading, data: user } = useUserQuery();
const router = useRouter();

watchEffect(() => {
    if (!isLoading.value) {
        const expDate = new Date(user.value?.subscription_end_at!);
        const today = new Date();
        if (expDate < today) {
            router.replace({
                name: 'dashboard',
            });
        }
    }
});
</script>
