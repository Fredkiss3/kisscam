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
