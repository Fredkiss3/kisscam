import { onMounted, onUnmounted } from 'vue';
import { QueryObserver, useQueryClient } from '@tanstack/vue-query';
import { defineStore } from 'pinia';
import { io } from 'socket.io-client';
import { SocketClientEvents, SocketServerEvents } from '@kisscam/shared';

import type { PiniaStore, AuthUser, UserPrefs } from './types';
import { randomInt } from './functions';

export const usePiniaStore = defineStore<
    'store',
    PiniaStore['state'],
    {
        hasVideo: (state?: PiniaStore['state']) => boolean;
    },
    PiniaStore['actions']
>('store', {
    state: () => {
        const userPrefStr = localStorage.getItem('userPreferences');
        const preferences = userPrefStr
            ? (JSON.parse(userPrefStr) as UserPrefs)
            : {};

        return {
            socket: null,
            user: null,
            room: {
                id: null,
                clients: {},
            },
            peers: {},
            preferences,
            currentStep: 'INITIAL',
        };
    },
    getters: {
        hasVideo(state?: PiniaStore['state']) {
            return (
                state?.preferences.stream
                    ?.getTracks()
                    .find((track) => track?.kind === 'video') !== undefined
            );
        },
    },
    actions: {
        setStream(stream: MediaStream) {
            this.preferences.stream = stream;
        },
        async createRoom({ roomName, username, twitchHostName, podTitle }) {
            if (this.user && this.socket) {
                this.currentStep = 'CREATING_ROOM';

                this.preferences = {
                    stream: null,
                    podTitle,
                    username,
                    twitchUserName: twitchHostName,
                    videoActivated: this.preferences?.videoActivated ?? true,
                    audioActivated: this.preferences?.audioActivated ?? true,
                };

                this.saveUserPreferences();

                this.socket.emit(SocketServerEvents.CreateRoom, {
                    roomName,
                    twitchHostName,
                    podTitle,
                    accessToken: this.user.access_token,
                });
            }
        },

        async joinRoom({ id, username, isEmbed, embbededClientUid }) {
            if (this.user) {
                this.preferences.username = username;
                this.saveUserPreferences();

                this.socket?.emit(SocketServerEvents.JoinRoom, {
                    roomId: id,
                    clientName: this.preferences.username,
                    asEmbed: isEmbed,
                    clientUid: this.user.id,
                    embedClientUid: embbededClientUid,
                });
            }
        },

        initSocket() {
            if (!this.socket) {
                this.socket = io(`//${import.meta.env.VITE_WS_URL}/`, {
                    transports: ['websocket'],
                })
                    .on('connect', () => {
                        console.log('connected');
                    })
                    .on(SocketClientEvents.RoomCreated, this.onRoomCreated)
                    .on(
                        SocketClientEvents.RoomAccessDenied,
                        this.onRoomAccessDenied
                    )
                    .on(SocketClientEvents.RoomJoined, this.onRoomJoined);
            }
        },

        onRoomCreated({ roomId, roomName, podTitle, twitchHostName }) {
            console.log(`Room Created : ${roomId} => ${roomName}`);

            this.room.id = roomId;
            this.room.name = roomName;
            this.room.podTitle = podTitle;
            this.room.twitchHostName = twitchHostName;

            this.currentStep = 'ROOM_CREATED';
        },

        onRoomAccessDenied() {
            this.currentStep = 'ROOM_ACCESS_DENIED';
            this.room.id = null;
        },

        onRoomJoined({ clients, roomId, roomName, podTitle, twitchHostName }) {
            this.currentStep = 'ROOM_JOINED';
            this.room.id = roomId;
            this.room.name = roomName;
            this.room.podTitle = podTitle;
            this.room.twitchHostName = twitchHostName;

            const listClients: Record<
                string,
                {
                    clientName: string;
                    peepNo: number;
                    isHost?: boolean;
                    isEmbed: boolean;
                }
            > = {};

            clients.forEach(({ clientUid, clientName, isHost, isEmbed }) => {
                listClients[clientUid] = {
                    clientName,
                    peepNo: randomInt(1, 10),
                    isHost,
                    isEmbed: !!isEmbed,
                };
            });

            this.room.clients = listClients;
        },

        leaveRoom() {
            // reset all room data
            this.socket?.disconnect();
            this.room.id = null;
            this.room.clients = {};
            this.initSocket();

            // close all peer connections
            Object.entries(this.peers).forEach(([id, peer]) => {
                peer.connection.close();
            });
            this.peers = {};
        },

        saveUserPreferences() {
            localStorage.setItem(
                'userPreferences',
                JSON.stringify(this.preferences)
            );
        },
    },
});

export function useStore() {
    const store = usePiniaStore();
    const queryClient = useQueryClient();
    const observer = new QueryObserver<AuthUser>(queryClient, {
        queryKey: ['session'],
    });

    let unsubscribe: Function | null = null;

    // initialize socket
    store.initSocket();

    onMounted(() => {
        observer.subscribe((result) => {
            store.user = result.data ?? null;
        });
    });

    onUnmounted(() => {
        unsubscribe?.();
    });

    return store;
}
