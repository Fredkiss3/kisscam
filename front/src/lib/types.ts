import type { Socket } from 'socket.io-client';
import type {
    SocketClientEvents,
    ServerEventMap,
    ClientEventMap,
} from '@kisscam/shared';
import type { User as SupabaseUser } from '@supabase/supabase-js';

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
    hostUid: string | null;
    clients: Record<
        string,
        {
            clientName: string;
            peepNo: number;
            isHost?: boolean;
            videoActivated?: boolean;
            audioActivated?: boolean;
            isEmbed: boolean;
            isPending?: boolean;
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
    | 'ROOM_CREATION_REFUSED'
    | 'ROOM_ACCESS_DENIED'
    | 'ROOM_ACCESS_REMOVED'
    | 'ROOM_ACCESS_PENDING'
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

export type Profile = {
    created_at: string;
    id: string;
    stripe_customer_id: string;
    subscription_end_at: string | null;
    subscribed_at: string | null;
    access_token: string;
};

export type UserPrefs = {
    stream: MediaStream | null;
    username: string;
    peepNo: number;
    podTitle: string | undefined;
    twitchUserName: string | undefined;
    videoActivated: boolean;
    audioActivated: boolean;
};

export type AuthUser = SupabaseUser & Profile;

export type PiniaStore = {
    state: {
        socket: Socket<ClientEventMap, ServerEventMap> | null;
        user: AuthUser | null;
        preferences: Partial<UserPrefs>;
        currentStep: StoreState;
        room: Room;
        peers: Record<string, Peer>; // clientId: Peer
    };
    actions: {
        createRoom(args: {
            roomName: string;
            username: string;
            twitchHostName?: string;
            podTitle?: string;
        }): Promise<void>;
        joinRoom(args: {
            id: string;
            username: string;
            isEmbed?: boolean;
            embbededClientUid?: string;
        }): Promise<void>;
        saveUserPreferences(): void;
        initSocket: () => void;
        leaveRoom: () => void;
        setStream: (stream: MediaStream) => void;
        grantAccessToRoom: (toClientId: string) => void;
        denyAccessToRoom: (toClientId: string) => void;
        removeAccessToRoom: (toClientId: string) => void;
        toggleVideo: () => Promise<void>;
        toggleAudio: () => Promise<void>;
        syncStream: (args: {
            clientId: string;
            state: {
                videoActivated?: boolean;
                audioActivated?: boolean;
            };
        }) => void;
        // events
        onRoomCreated: ClientEventMap[SocketClientEvents.RoomCreated];
        onRoomAccessDenied: ClientEventMap[SocketClientEvents.RoomAccessDenied];
        onRoomAccessPending: ClientEventMap[SocketClientEvents.RoomAccessPending];
        onRoomAccessGranted: ClientEventMap[SocketClientEvents.RoomAccessGranted];
        onRoomAccessRequired: ClientEventMap[SocketClientEvents.RoomAccessRequired];
        onRoomCreationRefused: ClientEventMap[SocketClientEvents.RoomCreationRefused];
        onRoomAccessRemoved: ClientEventMap[SocketClientEvents.RoomAccessRemoved];
        onRoomJoined: ClientEventMap[SocketClientEvents.RoomJoined];
        onClientDisconnected: ClientEventMap[SocketClientEvents.ClientDisconnected];
        onNewClient: ClientEventMap[SocketClientEvents.NewClient];
        onNewCandidate: ClientEventMap[SocketClientEvents.NewCandidate];
        onNewAnswer: ClientEventMap[SocketClientEvents.NewAnswer];
        onNewOffer: ClientEventMap[SocketClientEvents.NewOffer];
    };
    //
    // peers: Record<string, Peer>; // clientId: Peer
    // updateUserName: (args: { username: string }) => void;
    // leaveRoom: () => void;
    // toggleVideo: () => Promise<void>;
    // toggleAudio: () => Promise<void>;
    // syncStream: (args: {
    //     clientId: string;
    //     state: {
    //         videoActivated?: boolean;
    //         audioActivated?: boolean;
    //     };
    // }) => void;
};
