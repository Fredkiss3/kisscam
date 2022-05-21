export enum SocketClientEvent {
    OfferRequested = 'client:offer-requested',
    AnswerRequested = 'client:answer-requested',
    OfferSent = 'client:offer-sent',
    AnswerSent = 'client:answer-sent',
    Disconnected = 'client:disconnected',
    RoomCreated = 'client:room-created',
    RoomJoined = 'client:room-joined',
}

export interface ClientEventMap {
    [SocketClientEvent.OfferRequested]: (arg: { peerId: string }) => void;
    [SocketClientEvent.AnswerRequested]: (arg: {
        peerId: string;
        sdpOffer: object;
        iceCandidates: object[];
    }) => void;
    [SocketClientEvent.OfferSent]: (arg: {
        peerId: string;
        sdpOffer: object;
        candidates: object[];
    }) => void;
    [SocketClientEvent.AnswerSent]: (arg: {
        peerId: string;
        sdpAnswer: object;
        candidates: object[];
    }) => void;
    [SocketClientEvent.Disconnected]: (disconnectedPeerIds: string[]) => void;
    [SocketClientEvent.RoomCreated]: (arg: {
        roomId: string;
        roomName: string;
    }) => void;
    [SocketClientEvent.RoomJoined]: (arg: {
        roomId: string;
        roomName: string;
    }) => void;
}

export enum SocketServerEvent {
    CreateRoom = 'server:create-room',
    JoinRoom = 'server:join-room',
    SendOffer = 'server:send-offer',
    SendAnswer = 'server:send-answer',
}

export interface ServerEventMap {
    [SocketServerEvent.CreateRoom]: (roomName: string) => void;
    [SocketServerEvent.JoinRoom]: (arg: {
        roomId: string;
        clientName: string;
    }) => void;
    [SocketServerEvent.SendOffer]: (arg: {
        peerId: string;
        sdpOffer: object;
        candidates: object[];
    }) => void;
    [SocketServerEvent.SendAnswer]: (arg: {
        peerId: string;
        sdpAnswer: object;
        candidates: object[];
    }) => void;
}
