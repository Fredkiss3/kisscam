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
            });

            socket.value.on('connect', () => {
                console.log('connected');
            });

            socket.value.on(
                SocketClientEvent.RoomCreated,
                ({ roomId, roomName }) => {
                    roomData.id = roomId;
                    roomData.name = roomName;

                    console.log('created room : ', {
                        roomId,
                        roomName
                    });
                    currentStep.value = 'ROOM_CREATED';
                }
            );

            socket.value.on(
                SocketClientEvent.RoomJoined,
                ({ roomId, roomName, clients }) => {
                    console.log('Joined room : ', {
                        roomId,
                        roomName
                    });
                    currentStep.value = 'ROOM_JOINED';
                }
            );

            socket.value.on(SocketClientEvent.RoomNotFound, () => {
                console.log('Room not found');

                currentStep.value = 'ROOM_NOT_FOUND';
            });
        }
    });

    // change the roomId when the user joins a room
    watch(
        () => roomData.id,
        (id) => {
            if (id) {
                window.location.hash = `/room/${id}`;
            }
        }
    );

    return {
        socket: socket.value,
        user,
        room: roomData,
        currentStep,
        createRoom: ({
            roomName,
            username
        }: {
            roomName: string;
            username: string;
        }) => {
            user.name = username;
            localStorage.setItem('userName', username);

            socket.value?.emit(SocketServerEvent.CreateRoom, roomName);
            currentStep.value = 'CREATING_ROOM';
        },
        disconnect: () => {
            socket.value?.disconnect();
            socket.value = null;
            currentStep.value = 'INITIAL';
        },
        joinRoom: async (id: string, username: string) => {
            currentStep.value = 'JOINING_ROOM';
            user.name = username;
            localStorage.setItem('userName', username);
            await wait(2000);

            socket.value?.emit(SocketServerEvent.JoinRoom, {
                roomId: id,
                clientName: user.name
            });
        }
    };
}
