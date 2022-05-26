import { createApp } from 'vue';
import App from './App.vue';
import './assets/app.css';
import {
    ArrowLeftIcon,
    LogoutIcon,
    ArrowRightIcon,
    PlusIcon
} from '@heroicons/vue/outline';

const app = createApp(App);

app.component('ArrowRightIcon', ArrowRightIcon)
    .component('ArrowLeftIcon', ArrowLeftIcon)
    .component('LogoutIcon', LogoutIcon)
    .component('PlusIcon', PlusIcon);
app.mount('#app');
