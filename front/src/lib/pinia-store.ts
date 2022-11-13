import { onMounted, onUnmounted } from 'vue';
import { QueryObserver, useQueryClient } from '@tanstack/vue-query';
import { defineStore } from 'pinia';
import { io } from 'socket.io-client';
import { SocketClientEvents, SocketServerEvents } from '@kisscam/shared';
import { createPeerConnection, randomInt } from './functions';

import {
    PiniaStore,
    AuthUser,
    UserPrefs,
    Room,
    isToggleMessageType,
} from './types';

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
                    .on(SocketClientEvents.NewClient, this.onNewClient)
                    .on(SocketClientEvents.NewCandidate, this.onNewCandidate)
                    .on(SocketClientEvents.NewAnswer, this.onNewAnswer)
                    .on(SocketClientEvents.NewOffer, this.onNewOffer)
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

        async toggleAudio() {
            const userStream = this.preferences.stream;

            if (userStream) {
                userStream.getTracks().forEach((track) => {
                    if (track.kind === 'audio') {
                        track.enabled = !this.preferences.audioActivated;
                    }
                });

                // Notify the other clients' peers that the user has changed his video state
                for (const peer of Object.values(this.peers)) {
                    const { connection, dataChannel } = peer;

                    const sender = connection
                        .getSenders()
                        .find((sender) => sender.track?.kind === 'audio');

                    if (sender) {
                        await sender.replaceTrack(
                            userStream.getAudioTracks()[0]
                        );
                    }

                    dataChannel?.send(
                        JSON.stringify({
                            payload: {
                                audioActivated:
                                    !this.preferences.audioActivated,
                            },
                        })
                    );
                }

                this.preferences.audioActivated =
                    !this.preferences.audioActivated;

                this.saveUserPreferences();
            }
        },

        async toggleVideo() {
            const userStream = this.preferences.stream;

            if (userStream) {
                userStream.getTracks().forEach((track) => {
                    if (track.kind === 'video') {
                        track.enabled = !this.preferences.videoActivated;
                    }
                });

                // Notify the other clients' peers that the user has changed his video state
                for (const peer of Object.values(this.peers)) {
                    const { connection, dataChannel } = peer;

                    const sender = connection
                        .getSenders()
                        .find((sender) => sender.track?.kind === 'video');

                    if (sender) {
                        await sender.replaceTrack(
                            userStream.getVideoTracks()[0]
                        );
                    }

                    dataChannel?.send(
                        JSON.stringify({
                            payload: {
                                videoActivated:
                                    !this.preferences.videoActivated,
                            },
                        })
                    );
                }

                this.preferences.videoActivated =
                    !this.preferences.videoActivated;

                this.saveUserPreferences();
            }
        },

        syncStream({ clientId, state }) {
            // Sync remote client stream with ours
            const peer = this.peers[clientId];
            const isEmbed = this.room.clients[clientId]?.isEmbed;

            if (peer && !isEmbed) {
                const { stream } = peer;

                if (stream) {
                    if (state.videoActivated !== undefined) {
                        stream.getVideoTracks()[0].enabled =
                            state.videoActivated;
                        this.room.clients[clientId].videoActivated =
                            state.videoActivated;
                    }
                    if (state.audioActivated !== undefined) {
                        stream.getAudioTracks()[0].enabled =
                            state.audioActivated;
                        this.room.clients[clientId].audioActivated =
                            state.audioActivated;
                    }
                    console.log('syncStream', state);
                }
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

        onNewClient({ clientUid, clientName, isEmbed }) {
            if (this.user) {
                const clientInRoom = this.room.clients[clientUid];

                if (!clientInRoom && clientUid !== this.user.id && !isEmbed) {
                    // if (this.user.isEmbed && clientId !== this.user.idToFilter) {
                    //     return;
                    // }

                    this.room.clients[clientUid] = {
                        clientName,
                        peepNo: randomInt(1, 105),
                        isEmbed: !!isEmbed,
                    };

                    this.peers[clientUid] = {
                        connection: createPeerConnection(),
                        isInitiator: true,
                        stream: new MediaStream(),
                    };

                    const stream = this.preferences.stream;

                    const { connection } = this.peers[clientUid];
                    // connect only one way when embed
                    // if (this.user.isEmbed) {
                    //     connection.addTransceiver('audio', {
                    //         direction: 'recvonly',
                    //     });
                    //     connection.addTransceiver('video', {
                    //         direction: 'recvonly',
                    //     });
                    // }

                    if (stream) {
                        // Add local stream to peer connection only if not embed
                        stream
                            .getTracks()
                            .forEach((track) =>
                                connection.addTrack(track, stream)
                            );
                    }

                    // Send candidates when there are ones
                    connection.onicecandidate = (event) => {
                        if (event.candidate) {
                            this.socket?.emit(
                                SocketServerEvents.SendCandidate,
                                {
                                    toClientId: clientUid,
                                    iceCandidate: event.candidate,
                                }
                            );
                        }
                    };

                    // Add remote stream to peer connection
                    connection.ontrack = (event) => {
                        console.log(
                            `Received stream from peer "${clientUid}": `,
                            event.streams[0],
                            'client data => ',
                            this.room.clients[clientUid]
                        );

                        this.peers[clientUid].stream = event.streams[0];
                    };

                    // create channel for sending data
                    const channel = connection.createDataChannel(
                        `events-${this.user.id}-${clientUid}`
                    );

                    channel.onopen = (event) => {
                        // Send the user's stream state to the new client
                        channel.send(
                            JSON.stringify({
                                payload: {
                                    videoActivated:
                                        this.preferences.videoActivated,
                                    audioActivated:
                                        this.preferences.audioActivated,
                                },
                            })
                        );
                    };

                    // Listen for data channel messages
                    channel.onmessage = (event) => {
                        try {
                            const data = JSON.parse(event.data);
                            // If the message is a toggled video or audio state, update the client's stream
                            if (isToggleMessageType(data)) {
                                const { payload } = data;

                                this.syncStream({
                                    clientId: clientUid,
                                    state: payload,
                                });
                            }
                        } catch (error) {
                            console.error(error);
                        }
                    };

                    connection.onnegotiationneeded = (ev) => {
                        // if (this.user.isEmbed) {
                        //     connection
                        //         .createOffer({
                        //             offerToReceiveAudio: true,
                        //             offerToReceiveVideo: true,
                        //         })
                        //         .then((sdp) =>
                        //             connection.setLocalDescription(sdp)
                        //         )
                        //         .then(() => {
                        //             this.socket?.emit(
                        //                 SocketServerEvents.SendOffer,
                        //                 {
                        //                     toClientId: clientId,
                        //                     sdpOffer:
                        //                         connection.localDescription!,
                        //                 }
                        //             );
                        //         });
                        // } else {
                        connection
                            .createOffer()
                            .then((sdp) => connection.setLocalDescription(sdp))
                            .then(() => {
                                this.socket?.emit(
                                    SocketServerEvents.SendOffer,
                                    {
                                        toClientId: clientUid,
                                        sdpOffer: connection.localDescription!,
                                    }
                                );
                            });
                        // }
                    };

                    this.peers[clientUid].dataChannel = channel;
                }
            }
        },

        onNewAnswer({ fromClientId, sdpAnswer }) {
            const peer = this.peers[fromClientId];

            if (peer) {
                peer.connection.setRemoteDescription(
                    sdpAnswer as RTCSessionDescriptionInit
                );
            }
        },

        onNewOffer({ fromClientId, sdpOffer }) {
            const peer = this.peers[fromClientId];

            // Don't accept sdpOffer from not filtered client if embed
            // if (this.user.isEmbed && fromClientId !== this.user.idToFilter) {
            //     return;
            // }

            if (peer) {
                return;
            } else {
                this.peers[fromClientId] = {
                    connection: createPeerConnection(),
                    isInitiator: false,
                    stream: new MediaStream(),
                };

                // Add local stream to peer connection
                const { connection } = this.peers[fromClientId];

                // connect only one way when embed
                // if (this.user.isEmbed) {
                //     connection.addTransceiver('audio', {
                //         direction: 'recvonly',
                //     });
                //     connection.addTransceiver('video', {
                //         direction: 'recvonly',
                //     });
                // }

                const localStream = this.preferences.stream;

                if (localStream) {
                    // Add local stream to peer connection only if not embed
                    localStream
                        .getTracks()
                        .forEach((track) =>
                            connection.addTrack(track, localStream)
                        );
                }

                // Add remote stream to peer connection
                connection.ontrack = (event) => {
                    this.peers[fromClientId].stream = event.streams[0];
                };

                // Send candidates when there are ones
                connection.onicecandidate = (event) => {
                    if (event.candidate) {
                        this.socket?.emit(SocketServerEvents.SendCandidate, {
                            toClientId: fromClientId,
                            iceCandidate: event.candidate,
                        });
                    }
                };

                connection.ondatachannel = (event) => {
                    const channel = event.channel;

                    channel.onopen = (event) => {
                        // Send the user's stream state to the new client
                        channel.send(
                            JSON.stringify({
                                payload: {
                                    videoActivated:
                                        this.preferences.videoActivated,
                                    audioActivated:
                                        this.preferences.audioActivated,
                                },
                            })
                        );
                    };

                    // Listen for data channel messages
                    channel.onmessage = (event) => {
                        try {
                            const data = JSON.parse(event.data);
                            // If the message is a toggled video or audio state, update the client's stream
                            if (isToggleMessageType(data)) {
                                const { payload } = data;

                                this.syncStream({
                                    clientId: fromClientId,
                                    state: payload,
                                });
                            }
                        } catch (error) {
                            console.error(error);
                        }
                    };

                    this.peers[fromClientId].dataChannel = channel;
                };

                connection
                    .setRemoteDescription(sdpOffer as RTCSessionDescriptionInit)
                    .then(() => connection.createAnswer())
                    .then((sdp) => connection.setLocalDescription(sdp))
                    .then(() => {
                        this.socket?.emit(SocketServerEvents.SendAnswer, {
                            toClientId: fromClientId,
                            sdpAnswer: connection.localDescription!,
                        });
                    });
            }
        },

        onNewCandidate({ fromClientId, iceCandidate }) {
            const peer = this.peers[fromClientId];

            if (peer) {
                peer.connection.addIceCandidate(
                    new RTCIceCandidate(iceCandidate)
                );
            }
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
