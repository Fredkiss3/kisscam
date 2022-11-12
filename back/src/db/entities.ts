import { initClient } from '../lib/redis';
import { Entity, EntityData, Schema } from 'redis-om';

export class Client extends Entity {
    uid?: string;
    name?: string;
    socketId?: string | null;
    roomId?: string;
    embbeddedClientUid?: string | null;

    isHost?: boolean;
    isEmbed?: boolean;
    isOnline?: boolean;
    isPending?: boolean;

    constructor(schema: Schema<any>, id: string, data?: EntityData) {
        super(schema, id, data);
    }
}

export class Room extends Entity {
    id?: string;
    name?: string;
    twitchHostName?: string;
    podTitle?: string;
    hostUid?: string;

    constructor(schema: Schema<any>, id: string, data?: EntityData) {
        super(schema, id, data);
    }
}

/* create Schemas */
const clientSchema = new Schema(Client, {
    uid: {
        type: 'string',
    },
    socketId: {
        type: 'string',
    },
    roomId: {
        type: 'string',
    },
    isPending: {
        type: 'boolean',
    },
    embbeddedClientUid: {
        type: 'string',
    },
    name: {
        type: 'string',
    },
    isOnline: {
        type: 'boolean',
    },
    isHost: {
        type: 'boolean',
    },
    isEmbed: {
        type: 'boolean',
    },
});

const roomSchema = new Schema(Room, {
    hostUid: {
        type: 'string',
    },
    id: {
        type: 'string',
    },
    name: {
        type: 'string',
    },
    twitchHostName: {
        type: 'string',
    },
    podTitle: {
        type: 'string',
    },
});

export async function getRepositories() {
    const redisClient = await initClient();

    /* use the client to create a Repository just for Client */
    const clientRepository = redisClient.fetchRepository(clientSchema);
    const roomRepository = redisClient.fetchRepository(roomSchema);

    /* create the index for Person */
    await clientRepository.createIndex();
    await roomRepository.createIndex();

    return {
        clientRepository,
        roomRepository,
        redisClient,
    };
}
