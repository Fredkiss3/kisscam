// server --> client
export enum SocketClientEvents {
    // WebRTC Peer Negociation
    NewOffer = 'client:new-offer',
    NewCandidate = 'client:new-candidate',
    NewAnswer = 'client:new-answer',

    // Room management
    ClientDisconnected = 'client:disconnected',
    NewClient = 'client:new-client',
    RoomNotFound = 'client:room-not-found',

    // When user wants to create room
    RoomCreationRefused = 'client:room-creation-unauthorized',
    RoomCreated = 'client:room-created',
    RoomJoined = 'client:room-joined',

    // When user wants to join
    RoomAccessPending = 'client:room-access-pending',
    RoomAccessDenied = 'client:room-access-denied',
    RoomAccessGranted = 'client:room-access-granted',
    RoomAccessRemoved = 'client:room-access-removed',

    // the event that server sends to owner of the room
    RoomAccessRequired = 'client:room-access-required',

    // muted by owner
    MuteAudio = 'client:mute-audio',
}

export interface ClientEventMap {
    [SocketClientEvents.RoomCreationRefused]: () => void;
    [SocketClientEvents.RoomAccessDenied]: (arg: { roomId: string }) => void;
    [SocketClientEvents.RoomAccessPending]: (arg: { roomId: string }) => void;
    [SocketClientEvents.RoomAccessGranted]: (arg: { roomId: string }) => void;

    [SocketClientEvents.RoomAccessRequired]: (arg: {
        clientId: string;
    }) => void;

    [SocketClientEvents.RoomAccessRemoved]: (arg: { roomId: string }) => void;

    [SocketClientEvents.MuteAudio]: (arg: { roomId: string }) => void;

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
        clientUid: string;
        clientName: string;
        isEmbed?: boolean;
    }) => void;

    [SocketClientEvents.RoomJoined]: (arg: {
        roomId: string;
        roomName: string;
        twitchHostName?: string;
        podTitle?: string;
        clients: {
            clientUid: string;
            clientName: string;
            isHost: boolean;
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

    // When user wants to join
    GrantRoomAccess = 'server:grant-room-access',
    DenyRoomAccess = 'server:deny-room-access',

    // Kick user from room
    RemoveRoomAccess = 'server:remove-room-access',

    // Mute camera of video of participant
    MuteParticipant = 'server:mute-participant',
    LeaveRoom = 'server:leave-room',
}

export interface ServerEventMap {
    [SocketServerEvents.LeaveRoom]: () => void;

    [SocketServerEvents.CreateRoom]: (arg: {
        roomName: string;
        accessToken: string;
        twitchHostName?: string;
        podTitle?: string;
    }) => void;

    [SocketServerEvents.RemoveRoomAccess]: (arg: {
        toClientId: string;
    }) => void;

    [SocketServerEvents.MuteParticipant]: (arg: { toClientId: string }) => void;

    [SocketServerEvents.GrantRoomAccess]: (arg: { toClientId: string }) => void;

    [SocketServerEvents.DenyRoomAccess]: (arg: { toClientId: string }) => void;

    [SocketServerEvents.JoinRoom]: (arg: {
        clientUid: string;
        roomId: string;
        clientName: string;
        // embed options
        embedClientUid?: string;
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
