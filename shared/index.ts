// server --> client
export enum SocketClientEvents {
    // WebRTC Peer Negociation
    NewOffer = 'client:new-offer',
    NewCandidate = 'client:new-candidate',
    NewAnswer = 'client:new-answer',

    // Room management
    ClientDisconnected = 'client:disconnected',
    RoomCreated = 'client:room-created',
    RoomJoined = 'client:room-joined',
    NewClient = 'client:new-client',
    RoomNotFound = 'client:room-not-found',
}

export interface ClientEventMap {
    [SocketClientEvents.NewOffer]: (arg: {
        fromClientId: string;
        sdpOffer: object;
        isFromEmbed?: boolean;
    }) => void;

    [SocketClientEvents.NewCandidate]: (arg: {
        fromClientId: string;
        iceCandidate: object;
    }) => void;

    [SocketClientEvents.NewAnswer]: (arg: {
        fromClientId: string;
        sdpAnswer: object;
    }) => void;

    [SocketClientEvents.ClientDisconnected]: (arg: {
        clientId: string;
    }) => void;

    [SocketClientEvents.RoomCreated]: (arg: {
        roomId: string;
        roomName: string;
        twitchHostName?: string;
        podTitle?: string;
    }) => void;
    [SocketClientEvents.NewClient]: (arg: {
        clientId: string;
        clientName: string;
        isEmbed?: boolean;
    }) => void;
    [SocketClientEvents.RoomJoined]: (arg: {
        roomId: string;
        roomName: string;
        twitchHostName?: string;
        podTitle?: string;
        clients: {
            clientId: string;
            clientName: string;
            isHost?: boolean;
            isEmbed?: boolean;
        }[];
    }) => void;
    [SocketClientEvents.RoomNotFound]: () => void;
}

// client --> server
export enum SocketServerEvents {
    CreateRoom = 'server:create-room',
    JoinRoom = 'server:join-room',
    SendOffer = 'server:send-offer',
    SendAnswer = 'server:send-answer',
    SendCandidate = 'server:send-candidate',
}

export interface ServerEventMap {
    [SocketServerEvents.CreateRoom]: (arg: {
        roomName: string;
        twitchHostName?: string;
        podTitle?: string;
    }) => void;
    [SocketServerEvents.JoinRoom]: (arg: {
        roomId: string;
        clientName: string;
        isHost?: boolean;
        asEmbed?: boolean;
    }) => void;

    [SocketServerEvents.SendOffer]: (arg: {
        toClientId: string;
        sdpOffer: object;
    }) => void;

    [SocketServerEvents.SendAnswer]: (arg: {
        toClientId: string;
        sdpAnswer: object;
    }) => void;

    [SocketServerEvents.SendCandidate]: (arg: {
        toClientId: string;
        iceCandidate: object;
    }) => void;
}
