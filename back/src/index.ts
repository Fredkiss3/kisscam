import Fastify, { FastifyRequest } from 'fastify';
import fastifyIO from 'fastify-socket.io';
import cors from '@fastify/cors';
import { Socket } from 'socket.io';
import dotenv from 'dotenv';
import path from 'node:path';

// Load .env file
if (process.env.NODE_ENV !== 'production') {
    dotenv.config({
        path: path.join(path.resolve(__dirname, '..'), `.env.local`),
    });
}

import {
    ServerEventMap,
    SocketServerEvents,
    ClientEventMap,
} from '@kisscam/shared';
import { initClient } from './lib/redis';
import handlers from './handlers';
import {
    createBillingPortalSession,
    createCheckoutSession,
    createUserIfNotExists,
    stripeWebHookHandler,
} from './routes';
import { Type } from '@sinclair/typebox';

const server = Fastify({});

// Activate cors for all routes and all origins
server.register(cors, () => {
    return (req: FastifyRequest, callback: Function) => {
        callback(null, {
            origin: req.headers.origin ?? '*',
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
    server.listen(
        { port: Number(process.env.PORT), host: `0.0.0.0` },
        (err, address) => {
            if (err) {
                console.error(err);
                server.log.error(err);
                process.exit(1);
            }

            console.log(`@kisscam/api is listening at ${address}`);
        }
    );
};

/* =================================================== */
/* ====================== ROUTES ===================== */
/* =================================================== */
server.get('/api/ping', async (req, res) => {
    return { ping: 'pong' };
});

server.post(
    `/api/create-user-if-not-exists`,
    {
        schema: {
            body: Type.Object({
                uid: Type.String({
                    format: 'uuid',
                }),
                email: Type.String({
                    format: 'email',
                }),
            }),
        },
    },
    createUserIfNotExists
);

server.post(
    `/api/create-checkout-session`,
    {
        schema: {
            body: Type.Object({
                uid: Type.String({
                    format: 'uuid',
                }),
            }),
        },
    },
    createCheckoutSession
);

server.post(
    `/api/create-portal-session`,
    {
        schema: {
            body: Type.Object({
                uid: Type.String({
                    format: 'uuid',
                }),
            }),
        },
    },
    createBillingPortalSession
);

server.register((fastify, opts, next) => {
    fastify.addContentTypeParser(
        'application/json',
        { parseAs: 'buffer' },
        function (req, body, done) {
            try {
                var newBody = {
                    raw: body,
                };
                done(null, newBody);
            } catch (error: any) {
                error.statusCode = 400;
                done(error, undefined);
            }
        }
    );

    fastify.post(`/api/stripe-webhook-handler`, stripeWebHookHandler);

    next();
});

initClient()
    .then(() => {
        start();
    })
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
