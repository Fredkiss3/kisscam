import { createApp } from 'vue';
import { VueQueryPlugin } from '@tanstack/vue-query';
import FloatingVue from 'floating-vue';
import 'floating-vue/dist/style.css';
import { createPinia } from 'pinia';

import App from './App.vue';
import './assets/app.css';
import Home from './pages/Dashboard.vue';
import Room from './pages/Room.vue';
import JoinRoom from './pages/JoinRoom.vue';
import CreateRoom from './pages/CreateRoom.vue';
// import CreatePodCastRoom from './pages/CreatePodCastRoom.vue';
// import PodCastRoom from './pages/PodCastRoom.vue';
// import JoinPodRoom from './pages/JoinPodRoom.vue';
import NotFound from './pages/NotFound.vue';
import Embed from './pages/Embed.vue';
import Login from './pages/Login.vue';
import Callback from './pages/auth/CallbackPage.vue';
import AuthLayout from './pages/auth/Layout.vue';
import ProtectedLayout from './pages/ProtectedLayout.vue';
import PaymentGatedLayout from './pages/PaymentGatedLayout.vue';
import Success from './pages/payment/Success.vue';
import Cancelled from './pages/payment/Cancelled.vue';

import {
    createRouter,
    createWebHistory,
    type RouteRecordRaw,
} from 'vue-router';

const routes: RouteRecordRaw[] = [
    {
        path: '/',
        name: 'home',
        component: ProtectedLayout,
        children: [
            {
                path: '',
                name: 'dashboard',
                component: Home,
            },

            {
                path: '/room/:roomId([a-z0-9]{10})',
                name: 'call-room',
                component: Room,
            },

            // {
            //     path: '/pod/:roomId([a-z0-9]{10})',
            //     name: 'podcast-room',
            //     component: PodCastRoom,
            // },

            {
                path: 'payment',
                children: [
                    {
                        path: 'success',
                        name: 'payment-success',
                        component: Success,
                    },
                    {
                        path: 'cancelled',
                        name: 'payment-cancelled',
                        component: Cancelled,
                    },
                ],
            },
            {
                path: '/join',
                name: 'join',
                children: [
                    {
                        path: 'room',
                        name: 'join-call-room',
                        component: JoinRoom,
                    },
                    // {
                    //     path: 'pod-room',
                    //     name: 'join-pod-room',
                    //     component: JoinPodRoom,
                    // },
                ],
            },
            {
                path: 'create-room',
                component: PaymentGatedLayout,
                children: [
                    {
                        path: '',
                        name: 'create-call-room',
                        component: CreateRoom,
                    },
                    // {
                    //     path: 'podcast',
                    //     name: 'create-podcast-room',
                    //     component: CreatePodCastRoom,
                    // },
                ],
            },
        ],
    },

    { path: '/login', name: 'login', component: Login },
    {
        path: '/auth',
        component: AuthLayout,
        children: [
            {
                path: 'callback',
                name: 'callback',
                component: Callback,
            },
        ],
    },

    {
        path: '/embed/:roomId([a-z0-9]{10})/',
        name: 'embed',
        component: Embed,
    },

    {
        path: '/:pathMatch(.*)',
        name: 'not-found',
        component: NotFound,
        props: {
            message: '404 | Page Not Found',
        },
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

const pinia = createPinia();
const app = createApp(App);

app.use(pinia);
app.use(router);
app.use(VueQueryPlugin);
app.use(FloatingVue);

app.mount('#app');
