<template>
    <div class="h-screen flex flex-col items-center justify-center gap-10">
        <h1 class="font-bold text-4xl">Profile page</h1>
    </div>
</template>
<script setup lang="ts">
import { useAuthedSession } from '../../lib/use-auth';

const { isLoading, session } = useAuthedSession();
</script>
