import { reactive } from 'vue';
import { io } from 'socket.io-client';

import { createPeerConnection, randomInt, wait } from './functions';
import { isToggleMessageType, Store } from './types';

import { SocketClientEvents, SocketServerEvents } from '@dpkiss-call/shared';

const userInfosStr = localStorage.getItem('userInfos');
let userInfos = userInfosStr
    ? (JSON.parse(userInfosStr) as Pick<
          Store['user'],
          'audioActivated' | 'videoActivated' | 'name'
      >)
    : null;

const store = reactive<Store>({
    socket: null,
    user: {
        id: null,
        stream: null,
        name: userInfos?.name || '',
        videoActivated: userInfos?.videoActivated ?? true,
        audioActivated: userInfos?.audioActivated ?? true
    },
    room: {
        id: null,
        clients: {}
    },
    peers: {},
    currentStep: 'INITIAL',

    async createRoom({ roomName, username }) {
        this.user.name = username;
        this.currentStep = 'CREATING_ROOM';

        userInfos = {
            name: username,
            videoActivated: this.user.videoActivated,
            audioActivated: this.user.audioActivated
        };
        localStorage.setItem('userInfos', JSON.stringify(userInfos));

        // only wait in development mode
        if (import.meta.env.MODE === 'development') {
            await wait(1500);
        }

        this.socket?.emit(SocketServerEvents.CreateRoom, roomName);
    },

    async joinRoom({ id, username }) {
        this.currentStep = 'JOINING_ROOM';
        this.user.name = username;
        this.room.id = id;

        userInfos = {
            name: username,
            videoActivated: this.user.videoActivated,
            audioActivated: this.user.audioActivated
        };
        localStorage.setItem('userInfos', JSON.stringify(userInfos));

        // only wait in development mode
        if (import.meta.env.MODE === 'development') {
            await wait(1500);
        }

        this.socket?.emit(SocketServerEvents.JoinRoom, {
            roomId: id,
            clientName: this.user.name
        });
    },

    async toggleAudio() {
        const userStream = this.user.stream;

        if (userStream) {
            userStream.getTracks().forEach((track) => {
                if (track.kind === 'audio') {
                    track.enabled = !this.user.audioActivated;
                }
            });

            // Notify the other clients' peers that the user has changed his video state
            Object.values(this.peers).forEach((peer) => {
                const { connection, dataChannel } = peer;

                const sender = connection
                    .getSenders()
                    .find((sender) => sender.track?.kind === 'audio');

                if (sender) {
                    sender.replaceTrack(userStream.getAudioTracks()[0]);
                }

                dataChannel?.send(
                    JSON.stringify({
                        payload: {
                            audioActivated: !this.user.audioActivated
                        }
                    })
                );
            });

            this.user.audioActivated = !this.user.audioActivated;

            localStorage.setItem(
                'userInfos',
                JSON.stringify({
                    name: this.user.name,
                    videoActivated: this.user.videoActivated,
                    audioActivated: this.user.audioActivated
                })
            );
        }
    },

    async toggleVideo() {
        const userStream = this.user.stream;

        if (userStream) {
            userStream.getTracks().forEach((track) => {
                if (track.kind === 'video') {
                    track.enabled = !this.user.videoActivated;
                }
            });

            // Notify the other clients' peers that the user has changed his video state
            Object.values(this.peers).forEach((peer) => {
                const { connection, dataChannel } = peer;

                const sender = connection
                    .getSenders()
                    .find((sender) => sender.track?.kind === 'video');

                if (sender) {
                    sender.replaceTrack(userStream.getVideoTracks()[0]);
                }

                dataChannel?.send(
                    JSON.stringify({
                        payload: {
                            videoActivated: !this.user.videoActivated
                        }
                    })
                );
            });

            this.user.videoActivated = !this.user.videoActivated;

            localStorage.setItem(
                'userInfos',
                JSON.stringify({
                    name: this.user.name,
                    videoActivated: this.user.videoActivated,
                    audioActivated: this.user.audioActivated
                })
            );
        }
    },

    syncStream({ clientId, state }) {
        const peer = this.peers[clientId];

        if (peer) {
            const { stream } = peer;

            stream?.getTracks().forEach((track) => {
                if (
                    track.kind === 'video' &&
                    state.videoActivated !== undefined
                ) {
                    track.enabled = state.videoActivated;
                    this.room.clients[clientId].videoActivated =
                        state.videoActivated;
                }
                if (
                    track.kind === 'audio' &&
                    state.audioActivated !== undefined
                ) {
                    track.enabled = state.audioActivated;
                    this.room.clients[clientId].audioActivated =
                        state.audioActivated;
                }
            });
        }
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

                    const stream = this.user.stream;
                    if (stream) {
                        const { connection } = this.peers[clientId];
                        // Add local stream to peer connection
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

                        // Add remote stream to peer connection
                        connection.ontrack = (event) => {
                            this.peers[clientId].stream = event.streams[0];
                        };

                        // create channel for sending data
                        const channel = connection.createDataChannel(
                            `events-${this.user.id}-${clientId}`
                        );

                        channel.onopen = (event) => {
                            // Send the user's stream state to the new client
                            channel.send(
                                JSON.stringify({
                                    payload: {
                                        videoActivated:
                                            this.user.videoActivated,
                                        audioActivated: this.user.audioActivated
                                    }
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
                                        clientId,
                                        state: payload
                                    });
                                }
                            } catch (error) {
                                console.error(error);
                            }
                        };

                        connection.onnegotiationneeded = (ev) => {
                            connection
                                .createOffer()
                                .then((sdp) =>
                                    connection.setLocalDescription(sdp)
                                )
                                .then(() => {
                                    this.socket?.emit(
                                        SocketServerEvents.SendOffer,
                                        {
                                            toClientId: clientId,
                                            sdpOffer:
                                                connection.localDescription!
                                        }
                                    );
                                });
                        };

                        this.peers[clientId].dataChannel = channel;
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

                        connection.ondatachannel = (event) => {
                            const channel = event.channel;

                            channel.onopen = (event) => {
                                // Send the user's stream state to the new client
                                channel.send(
                                    JSON.stringify({
                                        payload: {
                                            videoActivated:
                                                this.user.videoActivated,
                                            audioActivated:
                                                this.user.audioActivated
                                        }
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
                                            state: payload
                                        });
                                    }
                                } catch (error) {
                                    console.error(error);
                                }
                            };

                            this.peers[fromClientId].dataChannel = channel;
                        };

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
