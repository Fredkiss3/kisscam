import { createApp } from 'vue';
import App from './App.vue';
import './assets/app.css';
import Home from './pages/Dashboard.vue';
import Room from './pages/Room.vue';
import JoinRoom from './pages/JoinRoom.vue';
import CreateRoom from './pages/CreateRoom.vue';
import CreatePodCastRoom from './pages/CreatePodCastRoom.vue';
import PodCastRoom from './pages/PodCastRoom.vue';
import JoinPodRoom from './pages/JoinPodRoom.vue';
import NotFound from './pages/NotFound.vue';
import Embed from './pages/Embed.vue';
import Login from './pages/Login.vue';
import Callback from './pages/auth/CallbackPage.vue';
import AuthLayout from './pages/auth/Layout.vue';
import BaseLayout from './pages/Layout.vue';
import Success from './pages/payment/Success.vue';
import Cancelled from './pages/payment/Cancelled.vue';
import Gateway from './pages/Gateway.vue';

import {
    createRouter,
    createWebHistory,
    type RouteRecordRaw,
} from 'vue-router';

const routes: RouteRecordRaw[] = [
    {
        path: '/',
        name: 'home',
        component: BaseLayout,
        children: [
            {
                path: '',
                name: 'profile',
                component: Home,
            },
            {
                path: 'gateway',
                name: 'payment-gateway',
                component: Gateway,
            },
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
    { path: '/create-room', name: 'create-room', component: CreateRoom },
    {
        path: '/room/:roomId([a-z0-9]{10})',
        name: 'call-room',
        component: Room,
    },
    {
        path: '/embed/:roomId([a-z0-9]{10})/:filterId([A-Za-z0-9-_]+)',
        name: 'embed',
        component: Embed,
    },
    {
        path: '/pod/:roomId([a-z0-9]{10})',
        name: 'podcast-room',
        component: PodCastRoom,
    },
    {
        path: '/create-podcast-room',
        name: 'create-podcast-room',
        component: CreatePodCastRoom,
    },
    { path: '/join-room', name: 'join-call-room', component: JoinRoom },
    { path: '/join-pod-room', name: 'join-pod-room', component: JoinPodRoom },
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

const app = createApp(App);
app.use(router);

app.mount('#app');
