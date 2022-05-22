import { ConnectionPair } from './lib/types';
import { DB, MAX_INTERCONNECTED_CLIENTS } from './lib/constants';
import { randomUUID, randomBytes } from 'crypto';
import type { Server, Socket } from 'socket.io';

import { SocketClientEvent, ClientEventMap } from '@dpkiss-call/shared';

export default function (socket: Partial<Socket>, server: Partial<Server>) {
    // the socket is always connected
    const clientSocket = socket as Socket<ClientEventMap>;
    const serverSocket = server as Server<ClientEventMap>;

    const onCreateRoom = async function (roomName: string) {
        const roomId = randomBytes(5).toString('hex');

        DB.rooms[roomId] = {
            name: roomName,
            clients: {},
            connectionPairs: [],
        };

        clientSocket.emit(SocketClientEvent.RoomCreated, { roomId, roomName });
        console.log('Room created:', { roomId, roomName });
    };

    const onJoinRoom = async function ({
        roomId,
        clientName,
    }: {
        roomId: string;
        clientName: string;
    }) {
        const room = DB.rooms[roomId];

        if (!room) {
            clientSocket.emit(SocketClientEvent.RoomNotFound);
            return;
        }

        // join the socket to the room
        clientSocket.join(roomId);
        const clientId = clientSocket.id;

        room.clients[clientId] = {
            id: clientId,
            name: clientName,
            peers: [],
        };

        if (room.connectionPairs.length == 0) {
            // create n - 1 pairs to connect to the other clients
            for (let i = 0; i < MAX_INTERCONNECTED_CLIENTS - 1; i++) {
                const peerId = randomUUID();

                // send request offer
                clientSocket.emit(SocketClientEvent.OfferRequested, {
                    peerId,
                });

                // save peerId
                room.connectionPairs.push({
                    initiator: {
                        clientId,
                        id: peerId,
                        sdpOffer: null,
                        iceCandidates: [],
                    },
                });
            }
        } else {
            // create n - 1 pairs to connect to the other clients
            let connectedClientIds: string[] = [];
            let numberOfPeersRemaining = MAX_INTERCONNECTED_CLIENTS - 1;

            for (let i = 0; i < room.connectionPairs.length; i++) {
                const peerId = randomUUID();

                const currentPair = room.connectionPairs[i];

                // do not connect :
                //  - if the client is already connected
                //  - and if the responder is already connected
                if (
                    !connectedClientIds.includes(
                        currentPair.initiator.clientId
                    ) &&
                    currentPair.responder === undefined
                ) {
                    // update the peerId
                    connectedClientIds.push(currentPair.initiator.clientId);
                    numberOfPeersRemaining--;

                    // send request offer
                    if (currentPair.initiator.sdpOffer !== null) {
                        clientSocket.emit(SocketClientEvent.AnswerRequested, {
                            peerId,
                            sdpOffer: currentPair.initiator.sdpOffer,
                            iceCandidates: currentPair.initiator.iceCandidates,
                        });
                    }

                    // modify directly the connectionPair
                    room.connectionPairs[i] = {
                        ...room.connectionPairs[i],
                        responder: {
                            clientId,
                            id: peerId,
                            sdpAnswer: null,
                            iceCandidates: [],
                        },
                    };
                }
            }

            for (let i = 0; i < numberOfPeersRemaining; i++) {
                const peerId = randomUUID();

                // send request offer
                clientSocket.emit(SocketClientEvent.OfferRequested, {
                    peerId,
                });

                // save peerId
                room.connectionPairs.push({
                    initiator: {
                        clientId,
                        id: peerId,
                        sdpOffer: null,
                        iceCandidates: [],
                    },
                });
            }
        }

        // send the room to the client
        clientSocket.emit(SocketClientEvent.RoomJoined, {
            roomId,
            roomName: room.name,
            clients: Object.values(room.clients)
                .filter((client) => client.id !== clientId)
                .map((client) => ({
                    clientId: client.id,
                    clientName: client.name,
                })),
        });

        // inform the other clients
        clientSocket.to(roomId).emit(SocketClientEvent.NewClient, {
            clientId,
            clientName,
        });

        console.log(
            `${clientName} joined room the room : ${DB.rooms[roomId].name} (${roomId})`
        );
        return;
    };

    const onOffer = async function ({
        peerId,
        sdpOffer,
        candidates,
    }: {
        peerId: string;
        sdpOffer: object;
        candidates: object[];
    }) {
        const roomId = [...clientSocket.rooms!][1];
        const room = DB.rooms[roomId];

        const connectionPair = room.connectionPairs.find(
            ({ initiator }) =>
                initiator.id === peerId && initiator.sdpOffer === null
        );

        if (connectionPair) {
            connectionPair.initiator.sdpOffer = sdpOffer;
            connectionPair.initiator.iceCandidates = candidates;

            clientSocket.to(roomId).emit(SocketClientEvent.OfferSent, {
                peerId,
                sdpOffer,
                candidates,
            });
        }
    };

    const onAnswer = async ({
        peerId,
        sdpAnswer,
        candidates,
    }: {
        peerId: string;
        sdpAnswer: object;
        candidates: object[];
    }) => {
        const roomId = [...clientSocket.rooms!][1];
        const room = DB.rooms[roomId];

        const connectionPair = room.connectionPairs.find(
            ({ responder }) =>
                responder?.id === peerId && responder.sdpAnswer === null
        ) as Required<ConnectionPair> | undefined;

        if (connectionPair) {
            connectionPair.responder.sdpAnswer = sdpAnswer;

            // send answer to the initiator
            clientSocket.to(connectionPair.initiator.clientId).emit(
                SocketClientEvent.AnswerSent,
                {
                    peerId,
                    sdpAnswer,
                    candidates,
                }
            );
        }
    };

    const onDisconnect = async function () {
        const id = clientSocket.id;

        const result = Object.entries(DB.rooms).find(
            ([, { clients }]) => id in clients
        );

        if (!result) {
            return;
        }

        const [roomId, room] = result;

        const deletedPairs: ConnectionPair[] = [];
        const newPairs = room.connectionPairs
            .map((pair) => {
                const { responder, initiator } = pair;

                if (initiator.clientId === id) {
                    deletedPairs.push(pair);
                    return undefined;
                } else if (responder?.clientId === id) {
                    // remove responder without removing the pair
                    return {
                        initiator,
                    };
                }

                return pair;
            })
            .filter(Boolean) as ConnectionPair[];

        // pass all the responders to initiators
        deletedPairs.forEach(({ responder }) => {
            if (responder) {
                newPairs.push({
                    initiator: {
                        clientId: responder.clientId,
                        id: responder.id,
                        sdpOffer: null,
                        iceCandidates: [],
                    },
                });
            }
        });

        room.connectionPairs = newPairs;

        // send disconnected event to all the clients in the room
        const clientPeers = room.clients[id]?.peers || [];
        serverSocket.sockets
            .in(roomId)
            .emit(SocketClientEvent.Disconnected, [
                ...clientPeers.map(({ id }) => id),
            ]);

        // send offer request to all the clients that were passed as initiators
        deletedPairs.forEach((pair) => {
            if (pair.responder) {
                serverSocket
                    .to(pair.responder.clientId)
                    .emit(SocketClientEvent.OfferRequested, {
                        peerId: pair.responder.id,
                    });
            }
        });

        console.log(
            `${room.clients[id].name} left the room : ${DB.rooms[roomId].name} (${roomId})`
        );

        // remove the client from the room
        delete room.clients[id];

        // if there is no more clients connected, delete the room
        if (Object.keys(room.clients).length === 0) {
            delete DB.rooms[roomId];
        }
    };

    return {
        onCreateRoom,
        onJoinRoom,
        onOffer,
        onAnswer,
        onDisconnect,
    };
}
