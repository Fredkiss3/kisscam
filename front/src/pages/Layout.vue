<template>
    <div class="h-screen flex flex-col items-center justify-center gap-4">
        <router-view></router-view>
    </div>

    <footer
        class="fixed bottom-0 left-0 right-0 p-2 bg-dark flex items-center justify-center"
    >
        <div class="text-center">
            Copyright &copy; 2022 By
            <a target="_blank" href="https://fredkiss.dev" class="underline">
                Adrien KISSIE</a
            >
            Contact me at
            <a class="font-bold underline" href="mailto:contact@kiss-cam.live"
                >contact@kiss-cam.live</a
            >
        </div>
    </footer>
</template>
