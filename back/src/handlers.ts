import { ConnectionPair } from './lib/types';
import { DB, MAX_INTERCONNECTED_CLIENTS } from './lib/constants';
import { randomUUID } from 'crypto';
import type { Server, Socket } from 'socket.io';

import { SocketClientEvent, ClientEventMap } from '@dpkiss-call/shared';

export default function (socket: Partial<Socket>, server: Partial<Server>) {
    // the socket is always connected
    const io = socket as Socket<ClientEventMap>;
    const socketServer = server as Server<ClientEventMap>;

    const onCreateRoom = async function (roomName: string) {
        const roomId = randomUUID();

        DB.rooms[roomId] = {
            name: roomName,
            clients: {},
            connectionPairs: [],
        };

        io.emit(SocketClientEvent.RoomCreated, { roomId });
    };

    const onJoinRoom = async function ({
        roomId,
        clientName,
    }: {
        roomId: string;
        clientName: string;
    }) {
        // join the socket to the room
        io.join(roomId);

        const room = DB.rooms[roomId];
        const clientId = io.id;

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
                io.emit(SocketClientEvent.OfferRequested, {
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
                        io.emit(SocketClientEvent.AnswerRequested, {
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
                io.emit(SocketClientEvent.OfferRequested, {
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
        const roomId = [...io.rooms!][1];
        const room = DB.rooms[roomId];

        const connectionPair = room.connectionPairs.find(
            ({ initiator }) =>
                initiator.id === peerId && initiator.sdpOffer === null
        );

        if (connectionPair) {
            connectionPair.initiator.sdpOffer = sdpOffer;
            connectionPair.initiator.iceCandidates = candidates;

            io.to(roomId).emit(SocketClientEvent.OfferSent, {
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
        const roomId = [...io.rooms!][1];
        const room = DB.rooms[roomId];

        const connectionPair = room.connectionPairs.find(
            ({ responder }) =>
                responder?.id === peerId && responder.sdpAnswer === null
        ) as Required<ConnectionPair> | undefined;

        if (connectionPair) {
            connectionPair.responder.sdpAnswer = sdpAnswer;

            // send answer to the initiator
            io.to(connectionPair.initiator.clientId).emit(
                SocketClientEvent.AnswerSent,
                {
                    peerId,
                    sdpAnswer,
                    candidates,
                }
            );
        }
    };

    const onDisconnect = async function ({ roomId }: { roomId: string }) {
        const id = io.id;
        const room = DB.rooms[roomId];

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
        socketServer.sockets
            .in(roomId)
            .emit(SocketClientEvent.Disconnected, [
                ...clientPeers.map(({ id }) => id),
            ]);

        // send offer request to all the clients that were passed as initiators
        deletedPairs.forEach((pair) => {
            if (pair.responder) {
                socketServer
                    .to(pair.responder.clientId)
                    .emit(SocketClientEvent.OfferRequested, {
                        peerId: pair.responder.id,
                    });
            }
        });

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
