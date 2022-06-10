import { reactive, watch, watchEffect } from 'vue';
import { io } from 'socket.io-client';

import { createPeerConnection, randomInt, wait } from './functions';
import { SocketClientEvent, SocketServerEvent } from '@dpkiss-call/shared';
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

        this.socket?.emit(SocketServerEvent.CreateRoom, roomName);
    },

    disconnect() {},

    async joinRoom({ id, username }) {
        this.currentStep = 'JOINING_ROOM';
        this.user.name = username;
        this.room.id = id;
        localStorage.setItem('userName', username);

        await wait(2000);

        this.socket?.emit(SocketServerEvent.JoinRoom, {
            roomId: id,
            clientName: this.user.name
        });
    },
    leaveRoom() {
        // reset all room data
        this.room.id = null;
        this.room.clients = {};
        this.socket?.disconnect();
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
            .on(SocketClientEvent.RoomCreated, ({ roomId, roomName }) => {
                this.room.id = roomId;
                this.room.name = roomName;

                // console.log('created room : ', {
                //     roomId,
                //     roomName
                // });
                this.currentStep = 'ROOM_CREATED';
            })
            .on(
                SocketClientEvent.RoomJoined,
                ({ roomId, roomName, clients }) => {
                    // console.log('Joined room : ', {
                    //     roomId,
                    //     roomName
                    // });
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
                }
            )
            .on(SocketClientEvent.RoomNotFound, () => {
                // console.log('Room not found');

                this.currentStep = 'ROOM_NOT_FOUND';
            })
            .on(SocketClientEvent.NewClient, ({ clientId, clientName }) => {
                // console.log('New client joined the room : ', {
                //     clientId,
                //     clientName
                // });

                const clientInRoom = this.room.clients[clientId];

                if (!clientInRoom) {
                    this.room.clients[clientId] = {
                        clientName,
                        peepNo: randomInt(1, 105)
                    };
                }
            })
            .on(SocketClientEvent.Disconnected, ({ clientId }) => {
                // console.log('Client disconnected : ', {
                //     clientId,
                //     peerIds
                // });

                const { [clientId]: client, ...otherClients } =
                    this.room.clients;

                this.room.clients = otherClients;

                // remove all peer connections
                const peersIdsToRemove = Object.entries(this.peers).filter(
                    ([peerId, peer]) => peer.clientId === clientId
                );

                peersIdsToRemove.forEach(([peerId, peer]) => {
                    peer.connection.close();
                    const { [peerId]: peerToRemove, ...otherPeers } =
                        this.peers;
                    this.peers = otherPeers;
                });
            })
            .on(SocketClientEvent.OfferRequested, ({ peerId }) => {
                console.log('Offer requested for id : ', peerId);
                let peer = this.peers[peerId];

                if (peer === undefined) {
                    peer = {
                        connection: createPeerConnection(),
                        candidates: [],
                        isInitiatior: true,
                        stream: new MediaStream()
                    };
                }

                const { connection, stream } = peer;

                this.peers[peerId] = peer;

                connection.onicecandidate = (event) => {
                    if (event.candidate) {
                        const peer = this.peers[peerId];
                        this.peers[peerId] = {
                            ...peer,
                            candidates: [...peer.candidates, event.candidate]
                        };
                    }
                };

                connection.addEventListener('icegatheringstatechange', () => {
                    if (connection.iceGatheringState === 'complete') {
                        // console.log(
                        //     'ICE gathering complete',
                        //     store.peers[peerId].candidates
                        // );

                        // Send offer only when ice candidates gathering is complete
                        this.socket?.emit(SocketServerEvent.SendOffer, {
                            peerId,
                            sdpOffer: JSON.parse(
                                JSON.stringify(connection.localDescription)
                            ),
                            candidates: this.peers[peerId].candidates
                        });
                    }
                });

                connection.ontrack = (event) => {
                    event.streams[0].getTracks().forEach((track) => {
                        console.log(
                            `Adding ${track.kind} track to remote stream.`
                        );

                        stream?.addTrack(track);
                    });
                };
            })
            .on(
                SocketClientEvent.AnswerRequested,
                ({
                    peerId,
                    iceCandidates,
                    sdpOffer,
                    fromPeerId,
                    fromClientId
                }) => {
                    console.log('Answer requested for id : ', peerId);
                    let peer = this.peers[peerId];

                    if (peer === undefined) {
                        peer = {
                            clientId: fromClientId,
                            connection: createPeerConnection(),
                            candidates: [],
                            isInitiatior: false,
                            stream: new MediaStream(),
                            offer: {
                                sdp: sdpOffer as RTCSessionDescriptionInit,
                                candidates: iceCandidates as RTCIceCandidate[]
                            }
                        };
                    }

                    const { connection, stream } = peer;
                    this.peers[peerId] = peer;

                    connection.onicecandidate = (event) => {
                        if (event.candidate) {
                            const peer = this.peers[peerId];
                            this.peers[peerId] = {
                                ...peer,
                                candidates: [
                                    ...peer.candidates,
                                    event.candidate
                                ]
                            };
                        }
                    };

                    connection.addEventListener(
                        'icegatheringstatechange',
                        () => {
                            if (connection.iceGatheringState === 'complete') {
                                console.log(
                                    'ICE gathering completed for answer',
                                    store.peers[peerId].candidates
                                );

                                // Send offer only when ice candidates gathering is complete
                                this.socket?.emit(
                                    SocketServerEvent.SendAnswer,
                                    {
                                        peerId,
                                        sdpAnswer: JSON.parse(
                                            JSON.stringify(
                                                connection.localDescription
                                            )
                                        ),
                                        candidates:
                                            this.peers[peerId].candidates
                                    }
                                );
                            }
                        }
                    );

                    connection.ontrack = (event) => {
                        event.streams[0].getTracks().forEach((track) => {
                            console.log(
                                `Adding ${track.kind} track to remote stream.`
                            );

                            stream?.addTrack(track);
                        });
                    };

                    store.room.clients[fromClientId].stream = stream;
                }
            )
            .on(
                SocketClientEvent.AnswerSent,
                ({ peerId, fromClientId, candidates, sdpAnswer, toPeerId }) => {
                    const peer = this.peers[toPeerId];

                    if (peer === undefined) {
                        return;
                    }

                    this.peers[toPeerId].clientId = fromClientId;
                    this.peers[toPeerId].answer = {
                        sdp: sdpAnswer as RTCSessionDescriptionInit,
                        candidates: candidates as RTCIceCandidate[]
                    };

                    // this.peers[toPeerId] = {
                    //     ...peer,
                    //     clientId: fromClientId,
                    //     answer: {
                    //         sdp: sdpAnswer as RTCSessionDescriptionInit,
                    //         candidates: candidates as RTCIceCandidate[]
                    //     }
                    // };

                    console.log(
                        `Answer sent from ${peerId}   to : ${toPeerId}`,
                        {
                            initiator: peer.isInitiatior
                        }
                    );

                    store.room.clients[fromClientId].stream = peer.stream;
                    // const { connection } = peer;
                    /* 
                         if (!pc.remoteDescription && pc.localDescription) {
    const offer = JSON.parse(answerTextArea.value);

    // Set remote description
    await pc.setRemoteDescription(offer);
  }                     
                    */
                }
            );
    }
});

store.initSocket();

//
watchEffect(async () => {
    const stream = store.user.stream;
    const peers = store.peers;

    if (stream) {
        // Push tracks from local stream to peer connections

        for (const track of stream.getTracks()) {
            for (const peerId in peers) {
                const peer = peers[peerId];

                try {
                    // console.log(`Adding ${track.kind} track to local stream.`);
                    peer.connection.addTrack(track, stream);
                } catch (error) {
                    // console.log(
                    //     `Local track (${track.kind}) already added to peer connection. ${peerId}`
                    // );
                }

                if (peer.isInitiatior) {
                    if (!peer.connection.localDescription) {
                        const offer = await peer.connection.createOffer();
                        try {
                            await peer.connection.setLocalDescription(offer);
                        } catch (error) {
                            // console.error(error);
                        }
                    } else {
                        if (!peer.connection.remoteDescription && peer.answer) {
                            console.log(
                                'Setting remote description for answer for peer : ',
                                peerId
                            );

                            await peer.connection.setRemoteDescription(
                                peer.answer.sdp
                            );
                        }
                    }
                } else {
                    if (!peer.connection.remoteDescription && peer.offer) {
                        await peer.connection.setRemoteDescription(
                            new RTCSessionDescription(peer.offer.sdp)
                        );

                        const answer = await peer.connection.createAnswer();

                        // Set local description
                        if (!peer.connection.localDescription) {
                            try {
                                await peer.connection.setLocalDescription(
                                    answer
                                );
                            } catch (error) {
                                // console.error(  error);
                            }
                        }

                        for (const candidate of peer.offer.candidates) {
                            await peer.connection.addIceCandidate(
                                new RTCIceCandidate(candidate)
                            );
                        }

                        console.log(
                            'Set remote description for peer : ',
                            peerId
                        );
                    }
                }
            }
        }

        // stream.getTracks().forEach((track) => {
        //     Object.entries(peers).forEach(([peerId, peer]) => {
        //         const { connection } = peer;
        //         try {
        //             connection.addTrack(track);

        //             if (peer.isInitiatior) {
        //                 connection.createOffer().then((offer) => {
        //                     console.log('Offer created', {
        //                         offer
        //                     });

        //                     if (!connection.localDescription) {
        //                         connection
        //                             .setLocalDescription(offer)
        //                             .then(() => {
        //                                 console.log('LocalDescription set');
        //                             });
        //                     }
        //                 });
        //             }
        //             // console.log(
        //             //     `Adding local track (${track.kind}) to peer connection. ${peerId}`
        //             // );
        //         } catch (error) {
        //             // console.log(
        //             //     `Local track (${track.kind}) already added to peer connection. ${peerId}`
        //             // );
        //         }
        //     });
        // });
    }
});

export function useStore() {
    return store;
}
