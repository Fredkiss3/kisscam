import { getRepositories } from './db/entities';
import { randomBytes } from 'crypto';
import type { Server, Socket } from 'socket.io';

import {
    ServerEventMap,
    ClientEventMap,
    SocketClientEvents,
    SocketServerEvents,
} from '@kisscam/shared';
import { supabaseAdmin, supabaseClient } from './lib/supabase-server';
import { checkIfUserIsSubscribed } from './lib/functions';

export default async function (
    clientSocket: Socket<ServerEventMap, ClientEventMap>,
    serverSocket: Server<ServerEventMap, ClientEventMap>
) {
    // the socket is always connected
    const { clientRepository, roomRepository, redisClient } =
        await getRepositories();

    const onCreateRoom: ServerEventMap[SocketServerEvents.CreateRoom] =
        async function ({
            roomName,
            accessToken,
            twitchHostName,
            podTitle,
        }: {
            roomName: string;
            accessToken: string;
            twitchHostName?: string;
            podTitle?: string;
        }) {
            const {
                data: { user },
            } = await supabaseClient.auth.getUser(accessToken);

            if (await checkIfUserIsSubscribed(user)) {
                clientSocket.emit(SocketClientEvents.RoomCreationRefused);
                return;
            }

            const roomId = randomBytes(5).toString('hex');

            const room = await roomRepository.createAndSave({
                id: roomId,
                name: roomName,
                twitchHostName: twitchHostName ?? '',
                podTitle: podTitle ?? '',
                hostUid: user!.id,
            });

            // The room should expire after 24 hours
            await redisClient.execute([
                'EXPIRE',
                `Room:${room.entityId}`,
                86_400,
            ]);

            clientSocket.emit(SocketClientEvents.RoomCreated, {
                roomId,
                roomName,
                twitchHostName,
                podTitle,
            });

            console.log('Room created:', {
                roomId,
                roomName,
                twitchHostName,
                podTitle,
            });
        };

    const onJoinRoom: ServerEventMap[SocketServerEvents.JoinRoom] =
        async function ({
            roomId,
            clientUid,
            clientName,
            embedClientUid,
            asEmbed,
        }: {
            roomId: string;
            clientName: string;
            clientUid: string;
            asEmbed?: boolean;
            embedClientUid?: string;
        }) {
            // Check room existence
            const room = await roomRepository
                .search()
                .where('id')
                .is.equalTo(roomId)
                .return.first();

            if (room === null) {
                clientSocket.emit(SocketClientEvents.RoomNotFound);
                return;
            }

            // Check user authentication
            const {
                data: { user },
                error,
            } = await supabaseAdmin.auth.admin.getUserById(clientUid);

            if (!user || error) {
                console.error(error);
                clientSocket.emit(SocketClientEvents.RoomAccessDenied, {
                    roomId,
                });
                return;
            }

            // get all the clients in the room
            const clientsInRoom = await clientRepository
                .search()
                .where('roomId')
                .is.equalTo(roomId)
                .and('pending')
                .is.equalTo(false)
                .return.all();

            const host = await clientRepository
                .search()
                .where('uid')
                .is.equalTo(room.hostUid!)
                .and('roomId')
                .is.equalTo(roomId)
                .return.first();

            // check if user needs access
            if (
                user.id !== room.hostUid &&
                clientsInRoom.find((c) => c.uid === user.id) === undefined
            ) {
                console.log(`user is not host ?`);

                // Deny access to embed if client have not been accepted previously
                // or is still pending
                if (asEmbed) {
                    clientSocket.emit(SocketClientEvents.RoomAccessDenied, {
                        roomId,
                    });
                    return;
                }

                // Add user to pending queue
                await clientRepository.createAndSave({
                    uid: user.id,
                    name: clientName,
                    roomId,
                    isHost: embedClientUid === room.hostUid, // can embed self
                    socketId: clientSocket.id,
                    isOnline: false,
                    pending: true,
                });

                // instruct user to wait
                clientSocket.emit(SocketClientEvents.RoomAccessPending, {
                    roomId,
                });

                // Send request to owner
                serverSocket
                    .to(host!.socketId!)
                    .emit(SocketClientEvents.RoomAccessRequired, {
                        clientId: clientUid,
                    });
                return;
            }

            // Check if embedded user exists
            if (asEmbed) {
                console.log(`user is embed ?`);
                if (!embedClientUid) {
                    clientSocket.emit(SocketClientEvents.RoomAccessDenied, {
                        roomId,
                    });
                    return;
                } else {
                    let embeddedClientUid = await clientRepository
                        .search()
                        .where('uid')
                        .is.equalTo(embedClientUid)
                        .where('roomId')
                        .is.equalTo(roomId)
                        .return.first();

                    if (!embeddedClientUid) {
                        clientSocket.emit(SocketClientEvents.RoomAccessDenied, {
                            roomId,
                        });
                        return;
                    }

                    // set username to emmbedded client name because we want the user embed
                    clientName = embeddedClientUid.name!;
                }
            }

            // join the socket to the room
            clientSocket.join(roomId);

            const clientSocketId = clientSocket.id;

            // We want a different Uid for the embed to set the difference in the Room
            const userId = asEmbed ? `${user.id}+${embedClientUid}` : user.id;

            // Save the client in the DB
            let client = await clientRepository
                .search()
                .where('uid')
                .is.equalTo(userId)
                .where('roomId')
                .is.equalTo(roomId)
                .and('pending')
                .is.equalTo(false)
                .return.first();

            if (client === null) {
                // create the client if the client not in the Room
                client = await clientRepository.createAndSave({
                    uid: userId,
                    name: clientName,
                    roomId,
                    isHost: embedClientUid === room.hostUid, // can embed self
                    embbeddedClientUid: embedClientUid ?? null,
                    isEmbed: !!asEmbed,
                    socketId: clientSocketId,
                    isOnline: true,
                    pending: false,
                });
            } else {
                // updates the client status & socket
                client.isOnline = true;
                client.socketId = clientSocketId;
                client.name = clientName;
                await clientRepository.save(client);
            }

            // Broadcast new client to all the other connected clients
            const clients = await clientRepository
                .search()
                .where('roomId')
                .is.equalTo(roomId)
                .where('uid')
                .is.not.equalTo(userId)
                .and('isOnline')
                .is.equalTo(true)
                .and('pending')
                .is.equalTo(false)
                .return.all();

            // send the room data to the client
            clientSocket.emit(SocketClientEvents.RoomJoined, {
                roomId,
                roomName: room.name!,
                twitchHostName: room.twitchHostName,
                podTitle: room.podTitle,
                clients: clients.map((client) => ({
                    clientUid: client.uid!,
                    clientName: client.name!,
                    isHost: !!client.isHost,
                    isEmbed: client.isEmbed,
                })),
            });

            // inform the other clients
            clientSocket.to(roomId).emit(SocketClientEvents.NewClient, {
                clientUid: userId,
                clientName,
                isEmbed: !!asEmbed,
            });

            console.log(
                `${clientName} joined room the room : ${room.name} (${roomId})`
            );
            return;
        };

    const onOffer: ServerEventMap[SocketServerEvents.SendOffer] =
        async function ({
            toClientId,
            sdpOffer,
        }: {
            toClientId: string;
            sdpOffer: object;
        }) {
            // the socket id is unique because one user can only connect to a room with one socket
            const initiatorClient = await clientRepository
                .search()
                .where('socketId')
                .is.equalTo(clientSocket.id)
                .and('isOnline')
                .is.equalTo(true)
                .return.first();

            if (initiatorClient === null) {
                console.log(
                    `Cannot send offer because the initiator user is no more connected.`
                );
                return;
            }

            // the client we want to send the candidate
            const targetClient = await clientRepository
                .search()
                .where('roomId')
                .is.equalTo(initiatorClient.roomId!)
                .and('uid')
                .is.equalTo(toClientId)
                .and('isOnline')
                .is.equalTo(true)
                .and('pending')
                .is.equalTo(false)
                .return.first();

            if (targetClient === null) {
                console.log(
                    `Cannot send offer because the target user is no more connected.`
                );
                return;
            }

            serverSocket
                .to(targetClient.socketId!)
                .emit(SocketClientEvents.NewOffer, {
                    fromClientId: initiatorClient.uid!,
                    sdpOffer,
                });
        };

    const onAnswer: ServerEventMap[SocketServerEvents.SendAnswer] =
        async function ({
            toClientId,
            sdpAnswer,
        }: {
            toClientId: string;
            sdpAnswer: object;
        }) {
            // the socket id is unique because one user can only connect to a room with one socket
            const initiatorClient = await clientRepository
                .search()
                .where('socketId')
                .is.equalTo(clientSocket.id)
                .and('isOnline')
                .is.equalTo(true)
                .return.first();

            if (initiatorClient === null) {
                console.log(
                    `Cannot send answer because the initiator user is no more connected.`
                );
                return;
            }

            // the client we want to send the candidate
            const targetClient = await clientRepository
                .search()
                .where('roomId')
                .is.equalTo(initiatorClient.roomId!)
                .and('uid')
                .is.equalTo(toClientId)
                .and('isOnline')
                .is.equalTo(true)
                .and('pending')
                .is.equalTo(false)
                .return.first();

            if (targetClient === null) {
                console.log(
                    `Cannot send answer because the target user is no more connected.`
                );
                return;
            }

            serverSocket
                .to(targetClient.socketId!)
                .emit(SocketClientEvents.NewAnswer, {
                    fromClientId: initiatorClient.uid!,
                    sdpAnswer,
                });
        };

    const onCandidate: ServerEventMap[SocketServerEvents.SendCandidate] =
        async function ({
            iceCandidate,
            toClientId,
        }: {
            iceCandidate: object;
            toClientId: string;
        }) {
            const clientSocketId = clientSocket.id;

            // the socket id is unique because one user can only connect to a room with one socket
            const initiatorClient = await clientRepository
                .search()
                .where('socketId')
                .is.equalTo(clientSocketId)
                .and('isOnline')
                .is.equalTo(true)
                .and('pending')
                .is.equalTo(false)
                .return.first();

            if (initiatorClient === null) {
                console.log(
                    `Cannot send candidate because the initiator user is no more connected.`
                );
                return;
            }

            // the client we want to send the candidate
            const targetClient = await clientRepository
                .search()
                .where('roomId')
                .is.equalTo(initiatorClient.roomId!)
                .and('uid')
                .is.equalTo(toClientId)
                .and('isOnline')
                .is.equalTo(true)
                .return.first();

            if (targetClient === null) {
                console.log(
                    `Cannot send candidate because the target user is no more connected.`
                );
                return;
            }

            serverSocket
                .to(targetClient.socketId!)
                .emit(SocketClientEvents.NewCandidate, {
                    fromClientId: initiatorClient.uid!,
                    iceCandidate,
                });
        };

    const onGrantRoomAccess: ServerEventMap[SocketServerEvents.GrantRoomAccess] =
        async ({ toClientId }: { toClientId: string }) => {
            const clientSocketId = clientSocket.id;

            // the socket id is unique because one user can only connect to a room with one socket
            const initiatorClient = await clientRepository
                .search()
                .where('socketId')
                .is.equalTo(clientSocketId)
                .and('isOnline')
                .is.equalTo(true)
                .return.first();

            if (initiatorClient === null) {
                console.log(
                    `Cannot grant access to room because the initiator user is not connected.`
                );
                return;
            }

            // Check if user is the host of the room
            const room = await roomRepository
                .search()
                .where('id')
                .is.equalTo(initiatorClient.roomId!)
                .return.first();

            if (room?.hostUid !== initiatorClient.uid) {
                console.log(
                    `Cannot grant access to room because the initiator user is not the creator of the room.`
                );
                return;
            }

            // the client we want to send the candidate
            const targetClient = await clientRepository
                .search()
                .where('roomId')
                .is.equalTo(initiatorClient.roomId!)
                .and('uid')
                .is.equalTo(toClientId)
                .and('isOnline')
                .is.equalTo(false)
                .and('pending')
                .is.equalTo(true)
                .return.first();

            if (targetClient === null) {
                console.log(
                    `Cannot grant access to room because the target user is not connected.`
                );
                return;
            }

            // update client status
            targetClient.pending = false;
            await clientRepository.save(targetClient);

            // send response to user
            serverSocket
                .to(targetClient.socketId!)
                .emit(SocketClientEvents.RoomAccessGranted, {
                    roomId: initiatorClient.roomId!,
                });
        };

    const onDenyRoomAccess: ServerEventMap[SocketServerEvents.DenyRoomAccess] =
        async ({ toClientId }: { toClientId: string }) => {
            const clientSocketId = clientSocket.id;

            // the socket id is unique because one user can only connect to a room with one socket
            const initiatorClient = await clientRepository
                .search()
                .where('socketId')
                .is.equalTo(clientSocketId)
                .and('isOnline')
                .is.equalTo(true)
                .return.first();

            if (initiatorClient === null) {
                console.log(
                    `Cannot deny access to room because the initiator user is not connected.`
                );
                return;
            }

            // Check if user is the host of the room
            const room = await roomRepository
                .search()
                .where('id')
                .is.equalTo(initiatorClient.roomId!)
                .return.first();

            if (room?.hostUid !== initiatorClient.uid) {
                console.log(
                    `Cannot deny access to room because the initiator user is not the creator of the room.`
                );
                return;
            }

            // // the client we want to send the candidate
            const targetClient = await clientRepository
                .search()
                .where('roomId')
                .is.equalTo(initiatorClient.roomId!)
                .and('uid')
                .is.equalTo(toClientId)
                .and('isOnline')
                .is.equalTo(false)
                .and('pending')
                .is.equalTo(true)
                .return.first();

            if (targetClient === null) {
                console.log(
                    `Cannot grant access to room because the target user is not connected.`
                );
                return;
            }

            // remove client from room
            await clientRepository.remove(targetClient.entityId);

            // send response to user
            serverSocket
                .to(targetClient.socketId!)
                .emit(SocketClientEvents.RoomAccessDenied, {
                    roomId: initiatorClient.roomId!,
                });
        };

    const onRemoveRoomAccess: ServerEventMap[SocketServerEvents.RemoveRoomAccess] =
        async ({ toClientId }: { toClientId: string }) => {
            const clientSocketId = clientSocket.id;

            // the socket id is unique because one user can only connect to a room with one socket
            const initiatorClient = await clientRepository
                .search()
                .where('socketId')
                .is.equalTo(clientSocketId)
                .and('isOnline')
                .is.equalTo(true)
                .return.first();

            if (initiatorClient === null) {
                console.log(
                    `Cannot deny access to room because the initiator user is not connected.`
                );
                return;
            }

            // Check if user is the host of the room
            const room = await roomRepository
                .search()
                .where('id')
                .is.equalTo(initiatorClient.roomId!)
                .return.first();

            if (room?.hostUid !== initiatorClient.uid) {
                console.log(
                    `Cannot deny access to room because the initiator user is not the creator of the room.`
                );
                return;
            }

            // the client we want to kick
            const targetClient = await clientRepository
                .search()
                .where('roomId')
                .is.equalTo(initiatorClient.roomId!)
                .and('uid')
                .is.equalTo(toClientId)
                .return.first();

            if (targetClient === null) {
                console.log(
                    `Cannot grant access to room because the target user is not connected.`
                );
                return;
            }
            await clientRepository.remove(targetClient.entityId);

            // send response to user
            serverSocket
                .to(targetClient.socketId!)
                .emit(SocketClientEvents.RoomAccessRemoved, {
                    roomId: initiatorClient.roomId!,
                });

            // remove the client's socket from room
            const socketsInRoom = await serverSocket.sockets
                .in(initiatorClient.roomId!)
                .fetchSockets();

            for (const socket of socketsInRoom) {
                if (socket.id === targetClient.socketId) {
                    socket.leave(initiatorClient.roomId!);
                }
            }

            console.log(
                `User ${targetClient.name} has been expelled from the room.`
            );
        };

    const onMuteParticipant: ServerEventMap[SocketServerEvents.MuteParticipant] =
        async ({ toClientId }: { toClientId: string }) => {
            const clientSocketId = clientSocket.id;

            // the socket id is unique because one user can only connect to a room with one socket
            const initiatorClient = await clientRepository
                .search()
                .where('socketId')
                .is.equalTo(clientSocketId)
                .and('isOnline')
                .is.equalTo(true)
                .return.first();

            if (initiatorClient === null) {
                console.log(
                    `Cannot deny access to room because the initiator user is not connected.`
                );
                return;
            }

            // Check if user is the host of the room
            const room = await roomRepository
                .search()
                .where('id')
                .is.equalTo(initiatorClient.roomId!)
                .return.first();

            if (room?.hostUid !== initiatorClient.uid) {
                console.log(
                    `Cannot deny access to room because the initiator user is not the creator of the room.`
                );
                return;
            }

            // // the client we want to send the candidate
            const targetClient = await clientRepository
                .search()
                .where('roomId')
                .is.equalTo(initiatorClient.roomId!)
                .and('uid')
                .is.equalTo(toClientId)
                .and('isOnline')
                .is.equalTo(false)
                .and('pending')
                .is.equalTo(false)
                .return.first();

            if (targetClient === null) {
                console.log(
                    `Cannot grant access to room because the target user is not connected.`
                );
                return;
            }

            // send response to user
            serverSocket
                .to(targetClient.socketId!)
                .emit(SocketClientEvents.MuteAudio, {
                    roomId: initiatorClient.roomId!,
                });
        };

    const onDisconnect = async function () {
        const clientSocketId = clientSocket.id;

        // the socket id is unique because one user can only connect to a room with one socket
        const client = await clientRepository
            .search()
            .where('socketId')
            .is.equalTo(clientSocketId)
            .return.first();

        if (client === null) {
            console.log(
                `Client '${clientSocketId}' disconnected but not in a room `
            );
            return;
        }

        if (!client.pending) {
            // Update the client status as offline
            client.isOnline = false;
            client.socketId = null;
            await clientRepository.save(client);
        } else {
            // Remove pending client
            await clientRepository.remove(client.entityId);
        }

        // send disconnected event to all the clients in the room
        serverSocket.sockets
            .in(client.roomId!)
            .emit(SocketClientEvents.ClientDisconnected, {
                clientId: client.uid!,
            });

        // remove the client from the room
        await clientSocket.leave(client.roomId!);

        console.log(
            `${client.name} (${client.entityId}) left the room : (${client.roomId})`
        );
    };

    return {
        onCreateRoom,
        onJoinRoom,
        onOffer,
        onAnswer,
        onDisconnect,
        onCandidate,
        onGrantRoomAccess,
        onDenyRoomAccess,
        onMuteParticipant,
        onRemoveRoomAccess,
    };
}
