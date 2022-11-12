import { onMounted, onUnmounted } from 'vue';
import { QueryObserver, useQueryClient } from '@tanstack/vue-query';
import { defineStore } from 'pinia';
import { io } from 'socket.io-client';
import { SocketClientEvents, SocketServerEvents } from '@kisscam/shared';

import type { PiniaStore, AuthUser, UserPrefs, Room } from './types';
import { randomInt } from './functions';

export const usePiniaStore = defineStore<
    'store',
    PiniaStore['state'],
    {
        hasVideo: (state?: PiniaStore['state']) => boolean;
        connectedClients: (
            state?: PiniaStore['state']
        ) => Array<Room['clients'][string] & { id: string }>;
        pendingClients: (
            state?: PiniaStore['state']
        ) => Array<Room['clients'][string] & { id: string }>;
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
                hostUid: null,
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
        connectedClients(state?: PiniaStore['state']) {
            return state === undefined
                ? []
                : Object.entries(state.room.clients)
                      .filter(([_, client]) => {
                          return !client.isEmbed && !client.isPending;
                      })
                      .map(([id, client]) => ({
                          id,
                          ...client,
                      }));
        },
        pendingClients(state?: PiniaStore['state']) {
            return state === undefined
                ? []
                : Object.entries(state.room.clients)
                      .filter(([_, client]) => {
                          return !client.isEmbed && client.isPending;
                      })
                      .map(([id, client]) => ({
                          id,
                          ...client,
                      }));
        },
    },
    actions: {
        /*******************************/
        /*********  ACTIONS  ************/
        /*******************************/
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
                    .on(SocketClientEvents.RoomJoined, this.onRoomJoined)
                    .on(
                        SocketClientEvents.RoomAccessPending,
                        this.onRoomAccessPending
                    )
                    .on(
                        SocketClientEvents.RoomAccessRequired,
                        this.onRoomAccessRequired
                    )
                    .on(
                        SocketClientEvents.RoomAccessDenied,
                        this.onRoomAccessDenied
                    )
                    .on(
                        SocketClientEvents.RoomAccessRemoved,
                        this.onRoomAccessRemoved
                    )
                    .on(
                        SocketClientEvents.RoomAccessGranted,
                        this.onRoomAccessGranted
                    )
                    .on(
                        SocketClientEvents.RoomCreationRefused,
                        this.onRoomCreationRefused
                    )
                    .on(
                        SocketClientEvents.NewClient,
                        ({ clientId, clientName, isEmbed }) => {
                            // TODO...
                        }
                    )
                    .on(
                        SocketClientEvents.ClientDisconnected,
                        this.onClientDisconnected
                    );
            }
        },

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
                    peepNo: randomInt(1, 105),
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
                this.currentStep = 'JOINING_ROOM';
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

        leaveRoom() {
            // reset all room data
            this.socket?.emit(SocketServerEvents.LeaveRoom);
            this.room.id = null;
            this.room.clients = {};

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

        grantAccessToRoom(toClientId) {
            this.socket?.emit(SocketServerEvents.GrantRoomAccess, {
                toClientId,
            });
        },

        denyAccessToRoom(toClientId) {
            this.socket?.emit(SocketServerEvents.DenyRoomAccess, {
                toClientId,
            });

            const { [toClientId]: client, ...otherClients } = this.room.clients;

            this.room.clients = otherClients;
        },

        removeAccessToRoom(toClientId) {
            this.socket?.emit(SocketServerEvents.RemoveRoomAccess, {
                toClientId,
            });

            const { [toClientId]: client, ...otherClients } = this.room.clients;

            this.room.clients = otherClients;

            // close peer connection
            const peer = this.peers[toClientId];
            if (peer) {
                peer.connection.close();
                delete this.peers[toClientId];
            }
        },

        /*******************************/
        /*********  EVENTS  ************/
        /*******************************/
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

        onRoomAccessRemoved() {
            this.leaveRoom();
            this.currentStep = 'ROOM_ACCESS_REMOVED';
            this.room.id = null;
        },

        onClientDisconnected({ clientId }) {
            const { [clientId]: client, ...otherClients } = this.room.clients;

            this.room.clients = otherClients;

            // close peer connection
            const peer = this.peers[clientId];
            if (peer) {
                peer.connection.close();
                delete this.peers[clientId];
            }
        },

        onRoomCreationRefused() {
            this.currentStep = 'ROOM_CREATION_REFUSED';
            this.room.id = null;
        },

        onRoomAccessPending() {
            this.currentStep = 'ROOM_ACCESS_PENDING';
        },

        onRoomAccessRequired({ clientId, clientName }) {
            if (!this.room.clients[clientId]) {
                this.room.clients[clientId] = {
                    clientName,
                    isPending: true,
                    isEmbed: false,
                    peepNo: randomInt(1, 105),
                };
            }
        },

        onRoomAccessGranted({ roomId }) {
            this.joinRoom({
                id: roomId,
                username: this.preferences.username!,
            });
        },

        onRoomJoined({
            clients,
            roomId,
            roomName,
            podTitle,
            twitchHostName,
            hostUid,
        }) {
            this.currentStep = 'ROOM_JOINED';
            this.room.id = roomId;
            this.room.name = roomName;
            this.room.podTitle = podTitle;
            this.room.twitchHostName = twitchHostName;
            this.room.hostUid = hostUid;

            const listClients: Record<
                string,
                {
                    clientName: string;
                    peepNo: number;
                    isHost?: boolean;
                    isEmbed: boolean;
                    isPending: boolean;
                }
            > = {};

            clients.forEach(
                ({ clientUid, clientName, isHost, isEmbed, isPending }) => {
                    listClients[clientUid] = {
                        clientName,
                        peepNo: randomInt(1, 105),
                        isHost,
                        isEmbed: !!isEmbed,
                        isPending,
                    };
                }
            );

            this.room.clients = listClients;
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
