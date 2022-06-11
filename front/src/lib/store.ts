import { reactive, watch, watchEffect } from 'vue';
import { io } from 'socket.io-client';

import { createPeerConnection, randomInt, wait } from './functions';
import { SocketClientEvents, SocketServerEvents } from '@dpkiss-call/shared';
import type { Store } from './types';

const store = reactive<Store>({
    socket: null,
    user: {
        id: null,
        name: localStorage.getItem('userName') ?? '',
        stream: null
    },
    room: {
        id: null,
        clients: {}
    },
    peers: {},
    currentStep: 'INITIAL',

    async createRoom({ roomName, username }) {
        this.user.name = username;
        localStorage.setItem('userName', username);
        this.currentStep = 'CREATING_ROOM';

        await wait(2000);

        this.socket?.emit(SocketServerEvents.CreateRoom, roomName);
    },

    disconnect() {},

    async joinRoom({ id, username }) {
        this.currentStep = 'JOINING_ROOM';
        this.user.name = username;
        this.room.id = id;
        localStorage.setItem('userName', username);

        await wait(2000);

        this.socket?.emit(SocketServerEvents.JoinRoom, {
            roomId: id,
            clientName: this.user.name
        });
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

    initSocket() {
        this.socket = io(`ws://${import.meta.env.VITE_WS_URL}/`, {
            transports: ['websocket']
        });

        // Listen for events
        this.socket
            .on('connect', () => {
                console.log('connected');
                this.user.id = store.socket!.id;
            })
            .on(SocketClientEvents.RoomCreated, ({ roomId, roomName }) => {
                this.room.id = roomId;
                this.room.name = roomName;
                this.currentStep = 'ROOM_CREATED';
            })
            .on(SocketClientEvents.RoomJoined, ({ roomName, clients }) => {
                this.currentStep = 'ROOM_JOINED';
                this.room.name = roomName;
                const listClients: Record<
                    string,
                    { clientName: string; peepNo: number }
                > = {};
                clients.forEach(({ clientId, clientName }) => {
                    listClients[clientId] = {
                        clientName,
                        peepNo: randomInt(1, 10)
                    };
                });

                this.room.clients = listClients;
            })
            .on(SocketClientEvents.RoomNotFound, () => {
                this.currentStep = 'ROOM_NOT_FOUND';
            })
            .on(SocketClientEvents.NewClient, ({ clientId, clientName }) => {
                const clientInRoom = this.room.clients[clientId];

                if (!clientInRoom) {
                    this.room.clients[clientId] = {
                        clientName,
                        peepNo: randomInt(1, 105)
                    };

                    this.peers[clientId] = {
                        connection: createPeerConnection(),
                        isInitiator: true,
                        stream: new MediaStream()
                    };

                    // Add local stream to peer connection
                    const stream = this.user.stream;
                    if (stream) {
                        const { connection } = this.peers[clientId];
                        stream
                            .getTracks()
                            .forEach((track) =>
                                connection.addTrack(track, stream)
                            );

                        // Send candidates when there are ones
                        connection.onicecandidate = (event) => {
                            if (event.candidate) {
                                this.socket?.emit(
                                    SocketServerEvents.SendCandidate,
                                    {
                                        toClientId: clientId,
                                        iceCandidate: event.candidate
                                    }
                                );
                            }
                        };

                        // Create offer and send it to the other peer
                        connection
                            .createOffer()
                            .then((sdp) => connection.setLocalDescription(sdp))
                            .then(() => {
                                this.socket?.emit(
                                    SocketServerEvents.SendOffer,
                                    {
                                        toClientId: clientId,
                                        sdpOffer: connection.localDescription!
                                    }
                                );
                            });

                        // Add remote stream to peer connection
                        connection.ontrack = (event) => {
                            this.peers[clientId].stream = event.streams[0];
                        };
                    }
                }
            })
            .on(SocketClientEvents.ClientDisconnected, ({ clientId }) => {
                const { [clientId]: client, ...otherClients } =
                    this.room.clients;

                this.room.clients = otherClients;

                // close peer connection
                const peer = this.peers[clientId];
                if (peer) {
                    peer.connection.close();
                    delete this.peers[clientId];
                }
            })
            .on(SocketClientEvents.NewOffer, ({ fromClientId, sdpOffer }) => {
                const peer = this.peers[fromClientId];

                if (peer) {
                    return;
                } else {
                    this.peers[fromClientId] = {
                        connection: createPeerConnection(),
                        isInitiator: false,
                        stream: new MediaStream()
                    };

                    // Add local stream to peer connection
                    const stream = this.user.stream;

                    if (stream) {
                        const { connection } = this.peers[fromClientId];
                        stream
                            .getTracks()
                            .forEach((track) =>
                                connection.addTrack(track, stream)
                            );

                        connection
                            .setRemoteDescription(
                                sdpOffer as RTCSessionDescriptionInit
                            )
                            .then(() => connection.createAnswer())
                            .then((sdp) => connection.setLocalDescription(sdp))
                            .then(() => {
                                this.socket?.emit(
                                    SocketServerEvents.SendAnswer,
                                    {
                                        toClientId: fromClientId,
                                        sdpAnswer: connection.localDescription!
                                    }
                                );
                            });

                        // Add remote stream to peer connection
                        connection.ontrack = (event) => {
                            this.peers[fromClientId].stream = event.streams[0];
                        };

                        // Send candidates when there are ones
                        connection.onicecandidate = (event) => {
                            if (event.candidate) {
                                this.socket?.emit(
                                    SocketServerEvents.SendCandidate,
                                    {
                                        toClientId: fromClientId,
                                        iceCandidate: event.candidate
                                    }
                                );
                            }
                        };
                    }
                }
            })
            .on(SocketClientEvents.NewAnswer, ({ fromClientId, sdpAnswer }) => {
                const peer = this.peers[fromClientId];

                if (peer) {
                    peer.connection.setRemoteDescription(
                        sdpAnswer as RTCSessionDescriptionInit
                    );
                }
            })
            .on(
                SocketClientEvents.NewCandidate,
                ({ fromClientId, iceCandidate }) => {
                    const peer = this.peers[fromClientId];

                    if (peer) {
                        peer.connection.addIceCandidate(
                            new RTCIceCandidate(iceCandidate)
                        );
                    }
                }
            );
    }
});

store.initSocket();

export function useStore() {
    return store;
}
