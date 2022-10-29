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
        if (!user.value?.subscribed_at) {
            router.replace({
                name: 'dashboard',
            });
        }
    }
});
</script>
