import Fastify from 'fastify';
import fastifyIO from 'fastify-socket.io';
import cors from '@fastify/cors';
import { Socket } from 'socket.io';
import type { AddressInfo } from 'net';

import {
    ServerEventMap,
    SocketServerEvent,
    ClientEventMap,
} from '@dpkiss-call/shared';

import handlers from './handlers';

const server = Fastify({});

// Activate cors for all routes and all origins
server.register(cors, () => {
    return (req, callback) => {
        callback(null, {
            origin: req.headers.origin as string,
        });
    };
});

// register the socket.io plugin
server.register(fastifyIO);

// we need to wait for the server to be ready, else `server.io` is undefined
server.ready().then(() => {
    server.io.on(
        'connection',
        (socket: Socket<ServerEventMap, ClientEventMap>) => {
            const {
                onAnswer,
                onCreateRoom,
                onDisconnect,
                onJoinRoom,
                onOffer,
            } = handlers(socket, server.io);

            socket.on(SocketServerEvent.CreateRoom, onCreateRoom);
            socket.on(SocketServerEvent.JoinRoom, onJoinRoom);
            socket.on(SocketServerEvent.SendOffer, onOffer);
            socket.on(SocketServerEvent.SendAnswer, onAnswer);

            socket.on(`disconnect`, onDisconnect);
        }
    );
});

const start = async () => {
    try {
        await server.listen(8080);

        const address = server.server.address() as AddressInfo;
        const port = typeof address === 'string' ? address : address?.port;

        // @ts-ignore
        console.log(
            `Server listening at ${address?.address.toString()}:${port}`
        );
    } catch (err) {
        console.error(err);

        server.log.error(err);
        process.exit(1);
    }
};
start();
