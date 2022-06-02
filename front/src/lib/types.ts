export type User = {
    id: string | null;
    name: string;
};

export type ClientData = {
    peers: RTCPeerConnection[];
};

export type Room = {
    id: string | null;
    name?: string;
};

export type StoreState =
    | 'INITIAL'
    | 'CREATING_ROOM'
    | 'ROOM_CREATED'
    | 'JOINING_ROOM'
    | 'ROOM_JOINED'
    | 'ROOM_NOT_FOUND';
