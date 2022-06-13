import { getRepositories } from './db/entities';
import { randomBytes } from 'crypto';
import type { Server, Socket } from 'socket.io';

import {
    ServerEventMap,
    ClientEventMap,
    SocketClientEvents,
} from '@kisscam/shared';

export default async function (
    clientSocket: Socket<ServerEventMap, ClientEventMap>,
    serverSocket: Server<ServerEventMap, ClientEventMap>
) {
    // the socket is always connected
    const { clientRepository, roomRepository, redisClient } =
        await getRepositories();

    const onCreateRoom = async function (roomName: string) {
        const roomId = randomBytes(5).toString('hex');

        const room = await roomRepository.createAndSave({
            id: roomId,
            name: roomName,
        });

        // The room should expire after 24 hours
        await redisClient.execute(['EXPIRE', `Room:${room.entityId}`, 86400]);

        clientSocket.emit(SocketClientEvents.RoomCreated, { roomId, roomName });

        console.log('Room created:', { roomId, roomName });
    };

    const onJoinRoom = async function ({
        roomId,
        clientName,
    }: {
        roomId: string;
        clientName: string;
    }) {
        const room = await roomRepository
            .search()
            .where('id')
            .equals(roomId)
            .return.first();

        if (room === null) {
            clientSocket.emit(SocketClientEvents.RoomNotFound);
            return;
        }

        // join the socket to the room
        clientSocket.join(roomId);

        const clientId = clientSocket.id;

        // Save the client in the DB
        const client = await clientRepository
            .search()
            .where('id')
            .equals(clientId)
            .where('roomId')
            .equals(roomId)
            .return.first();

        if (client !== null) {
            // do not save the client if the client is already in the Room
            return;
        }

        await clientRepository.createAndSave({
            id: clientId,
            name: clientName,
            roomId,
        });

        // get all the clients in the room
        const clients = await clientRepository
            .search()
            .where('roomId')
            .equals(roomId)
            .where('id')
            .is.not.equalTo(clientId)
            .return.all();

        // send the room to the client
        clientSocket.emit(SocketClientEvents.RoomJoined, {
            roomId,
            roomName: room.name!,
            clients: clients.map((client) => ({
                clientId: client.id!,
                clientName: client.name!,
            })),
        });

        // inform the other clients
        clientSocket.to(roomId).emit(SocketClientEvents.NewClient, {
            clientId,
            clientName,
        });

        console.log(
            `${clientName} joined room the room : ${room.name} (${roomId})`
        );
        return;
    };

    const onOffer = async function ({
        toClientId,
        sdpOffer,
    }: {
        toClientId: string;
        sdpOffer: object;
    }) {
        serverSocket.to(toClientId).emit(SocketClientEvents.NewOffer, {
            fromClientId: clientSocket.id,
            sdpOffer,
        });
    };

    const onAnswer = async function ({
        toClientId,
        sdpAnswer,
    }: {
        toClientId: string;
        sdpAnswer: object;
    }) {
        serverSocket.to(toClientId).emit(SocketClientEvents.NewAnswer, {
            fromClientId: clientSocket.id,
            sdpAnswer,
        });
    };

    const onDisconnect = async function () {
        const id = clientSocket.id;

        const client = await clientRepository
            .search()
            .where('id')
            .equals(id)
            .return.all();

        if (client.length === 0) {
            console.log(`Client '${id}' disconnected but not in a room `);
            return;
        }

        // send disconnected event to all the clients in the room
        serverSocket.sockets
            .in(client[0].roomId!)
            .emit(SocketClientEvents.ClientDisconnected, {
                clientId: id,
            });

        // remove the client from the Room
        for (const c of client) {
            await clientRepository.remove(c.entityId);
        }

        // remove the client from the room
        await clientSocket.leave(client[0].roomId!);

        console.log(
            `${client[0].name} (${client[0].entityId}) left the room : (${client[0].roomId})`
        );
    };

    const onCandidate = async function ({
        iceCandidate,
        toClientId,
    }: {
        iceCandidate: object;
        toClientId: string;
    }) {
        serverSocket.to(toClientId).emit(SocketClientEvents.NewCandidate, {
            fromClientId: clientSocket.id,
            iceCandidate,
        });
    };

    return {
        onCreateRoom,
        onJoinRoom,
        onOffer,
        onAnswer,
        onDisconnect,
        onCandidate,
    };
}
