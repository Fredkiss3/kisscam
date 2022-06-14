import Fastify, { FastifyRequest } from 'fastify';
import fastifyIO from 'fastify-socket.io';
import cors from '@fastify/cors';
import { Socket } from 'socket.io';
import type { AddressInfo } from 'net';
import dotenv from 'dotenv';

// Load .env file
if (process.env.NODE_ENV !== 'production') {
    dotenv.config({
        path: `${__dirname}/.env.local`,
    });
}

import {
    ServerEventMap,
    SocketServerEvents,
    ClientEventMap,
} from '@kisscam/shared';
import { initClient } from './lib/redis';
import handlers from './handlers';

const server = Fastify({});

// Activate cors for all routes and all origins
server.register(cors, () => {
    return (req: FastifyRequest, callback: Function) => {
        callback(null, {
            origin: req.headers.origin as string,
        });
    };
});

// register the socket.io plugin
server.register(fastifyIO);

// we need to wait for the server to be ready, else `server.io` is undefined
server.ready().then(() => {
    // @ts-ignore
    server.io.on(
        'connection',
        (socket: Socket<ServerEventMap, ClientEventMap>) => {
            // @ts-ignore
            handlers(socket, server.io).then(
                ({
                    onAnswer,
                    onCreateRoom,
                    onDisconnect,
                    onJoinRoom,
                    onOffer,
                    onCandidate,
                }) => {
                    socket.on(SocketServerEvents.CreateRoom, onCreateRoom);
                    socket.on(SocketServerEvents.JoinRoom, onJoinRoom);
                    socket.on(SocketServerEvents.SendOffer, onOffer);
                    socket.on(SocketServerEvents.SendAnswer, onAnswer);
                    socket.on(SocketServerEvents.SendCandidate, onCandidate);

                    socket.on(`disconnect`, onDisconnect);
                }
            );
        }
    );
});

// Start the server
const start = async () => {
    try {
        await server.listen(8080, `0.0.0.0`);

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

initClient()
    .then(() => {
        start();
    })
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
