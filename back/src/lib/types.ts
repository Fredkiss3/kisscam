export type Peer = {
  id: string;
  clientId: string;
};

export type Client = {
  id: string;
  name: string;
  peers: Peer[];
};

export type ConnectionPair = {
  initiator: Peer & {
    sdpOffer: object | null;
    iceCandidates: Array<object>; // {key: value}
  };
  responder?: Peer & {
    sdpAnswer: object | null;
    iceCandidates: Array<object>; // {key: value}s
  };
};

export type Room = {
  name: string;
  clients: Record<string, Client>; // id => client
  connectionPairs: Array<ConnectionPair>;
};

export type Database = {
  rooms: Record<string, Room>; // id => room
};

export enum SocketClientEvent {
  OfferRequested = "client:offer-requested",
  AnswerRequested = "client:answer-requested",
  OfferSent = "client:offer-sent",
  AnswerSent = "client:answer-sent",
  Disconnected = "client:disconnected",
  RoomCreated = "client:room-created",
}

export interface EventMap {
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
  [SocketClientEvent.RoomCreated]: (arg: { roomId: string }) => void;
}
