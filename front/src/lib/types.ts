import type { Socket } from 'socket.io-client';
import type { ServerEventMap, ClientEventMap } from '@dpkiss-call/shared';

export type User = {
    id: string | null;
    name: string;
    stream: MediaStream | null;
};

export type ClientData = {
    peers: RTCPeerConnection[];
};

export type Room = {
    id: string | null;
    name?: string;
    clients: { clientId: string; clientName: string; peepNo: number }[];
};

export type StoreState =
    | 'INITIAL'
    | 'CREATING_ROOM'
    | 'ROOM_CREATED'
    | 'JOINING_ROOM'
    | 'ROOM_JOINED'
    | 'ROOM_NOT_FOUND';

export type Store = {
    socket: Socket<ClientEventMap, ServerEventMap> | null;
    user: User;
    room: Room;
    currentStep: StoreState;
    createRoom: (args: { roomName: string; username: string }) => Promise<void>;
    disconnect: () => void;
    joinRoom: (args: { id: string; username: string }) => Promise<void>;
    leaveRoom: () => void;
};
