import type { Socket } from 'socket.io-client';
import type { ServerEventMap, ClientEventMap } from '@kisscam/shared';

export type User = {
    id: string | null;
    name: string;
    twitchUserName?: string;
    podTitle?: string;
    stream: MediaStream | null;
    videoActivated?: boolean;
    audioActivated?: boolean;
    isEmbed?: boolean;
    idToFilter?: string;
};

export type Room = {
    id: string | null;
    name?: string;
    podTitle?: string;
    twitchHostName?: string;
    clients: Record<
        string,
        {
            clientName: string;
            peepNo: number;
            isHost?: boolean;
            videoActivated?: boolean;
            audioActivated?: boolean;
            isEmbed: boolean;
        }
    >;
};

export type Peer = {
    connection: RTCPeerConnection;
    isInitiator: boolean;
    stream?: MediaStream;
    dataChannel?: RTCDataChannel;
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
    peers: Record<string, Peer>; // clientId: Peer
    createRoom: (args: {
        roomName: string;
        username: string;
        twitchHostName?: string;
        podTitle?: string;
    }) => Promise<void>;
    joinRoom: (args: {
        id: string;
        username: string;
        embed?: boolean;
        filter?: string;
    }) => Promise<void>;
    updateUserName: (args: { username: string }) => void;
    leaveRoom: () => void;
    initSocket: () => void;
    toggleVideo: () => Promise<void>;
    toggleAudio: () => Promise<void>;
    syncStream: (args: {
        clientId: string;
        state: {
            videoActivated?: boolean;
            audioActivated?: boolean;
        };
    }) => void;
};

export type ToggleMessageType = {
    payload: {
        videoActivated?: boolean;
        audioActivated?: boolean;
    };
};

export function isToggleMessageType(
    message: any
): message is ToggleMessageType {
    return 'payload' in message;
}
