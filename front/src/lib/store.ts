import { ref, reactive, watch } from 'vue';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import type { User, Room, StoreState } from './types';
import { wait } from './functions';
import type { ServerEventMap, ClientEventMap } from '@dpkiss-call/shared';
import { SocketClientEvent, SocketServerEvent } from '@dpkiss-call/shared';

import { onMounted, onUnmounted } from 'vue';

// Our global socket object
export const socket = ref<Socket<ClientEventMap, ServerEventMap> | null>(null);

export const user = reactive<User>({
    id: null,
    name: localStorage.getItem('userName') ?? ''
});

export const roomData = reactive<Room>({
    id: null
});

export const currentStep = ref<StoreState>('INITIAL');

export function useStore() {
    onMounted(() => {
        console.log('Mounting component');

        if (!socket.value) {
            socket.value = io(`ws://localhost:8080/`, {
                transports: ['websocket']
            })
                .on('connect', () => {
                    console.log('connected');
                })
                .on(SocketClientEvent.RoomCreated, ({ roomId, roomName }) => {
                    roomData.id = roomId;
                    roomData.name = roomName;

                    console.log('created room : ', {
                        roomId,
                        roomName
                    });
                    currentStep.value = 'ROOM_CREATED';
                })
                .on(
                    SocketClientEvent.RoomJoined,
                    ({ roomId, roomName, clients }) => {
                        console.log('Joined room : ', {
                            roomId,
                            roomName
                        });
                        currentStep.value = 'ROOM_JOINED';
                    }
                )
                .on(SocketClientEvent.RoomNotFound, () => {
                    console.log('Room not found');

                    currentStep.value = 'ROOM_NOT_FOUND';
                });
        }
    });

    return {
        socket: socket.value,
        user,
        room: roomData,
        currentStep,
        createRoom: async ({
            roomName,
            username
        }: {
            roomName: string;
            username: string;
        }) => {
            user.name = username;
            localStorage.setItem('userName', username);
            currentStep.value = 'CREATING_ROOM';

            await wait(2000);

            socket.value?.emit(SocketServerEvent.CreateRoom, roomName);
        },
        disconnect: () => {
            socket.value?.disconnect();
            socket.value = null;
            currentStep.value = 'INITIAL';
            roomData.id = null;
            roomData.name = '';
        },
        joinRoom: async (id: string, username: string) => {
            currentStep.value = 'JOINING_ROOM';
            user.name = username;
            roomData.id = id;
            localStorage.setItem('userName', username);

            await wait(2000);

            socket.value?.emit(SocketServerEvent.JoinRoom, {
                roomId: id,
                clientName: user.name
            });
        }
    };
}
