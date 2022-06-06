import { reactive } from 'vue';
import { io } from 'socket.io-client';

import { randomInt, wait } from './functions';
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
        clients: []
    },
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
        this.socket?.emit(SocketServerEvent.Disconnect);
        // reset all room data
        this.room.id = null;
        this.room.clients = [];
    }
});

store.socket = io(`ws://${import.meta.env.VITE_WS_URL}/`, {
    transports: ['websocket']
});

// Listen for events
store.socket
    .on('connect', () => {
        console.log('connected');
        store.user.id = store.socket!.id;
    })
    .on(SocketClientEvent.RoomCreated, ({ roomId, roomName }) => {
        store.room.id = roomId;
        store.room.name = roomName;

        console.log('created room : ', {
            roomId,
            roomName
        });
        store.currentStep = 'ROOM_CREATED';
    })
    .on(SocketClientEvent.RoomJoined, ({ roomId, roomName, clients }) => {
        console.log('Joined room : ', {
            roomId,
            roomName
        });
        store.currentStep = 'ROOM_JOINED';
        store.room.name = roomName;
        store.room.clients = clients.map(({ clientId, clientName }) => ({
            clientId,
            clientName,
            peepNo: randomInt(1, 105)
        }));
    })
    .on(SocketClientEvent.RoomNotFound, () => {
        console.log('Room not found');

        store.currentStep = 'ROOM_NOT_FOUND';
    })
    .on(SocketClientEvent.NewClient, ({ clientId, clientName }) => {
        console.log('New client joined the room : ', {
            clientId,
            clientName
        });

        const clientInRoom = store.room.clients.find(
            (client) => client.clientId === clientId
        );

        if (!clientInRoom) {
            store.room.clients.push({
                clientId,
                clientName,
                peepNo: randomInt(1, 105)
            });
        }
    })
    .on(SocketClientEvent.Disconnected, ({ clientId, peerIds }) => {
        console.log('Client disconnected : ', {
            clientId,
            peerIds
        });

        store.room.clients = store.room.clients.filter(
            ({ clientId: id }) => id !== clientId
        );
    });

export function useStore() {
    return store;
}
