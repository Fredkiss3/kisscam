export type Peer = {
  id: string;
  clientId: string;
};

export type Client = {
  id: string;
  name: string;
  peers: Peer[];
};

export type Room = {
  name: string;
  clients: Record<string, Client>; // id => client
  connectionPairs: Array<{
    initiator: Peer & {
      sdpOffer: object | null;
      iceCandidates: Array<Record<string, string>>; // {key: value}
    };
    responder?: Peer & {
      sdpAnswer: object | null;
      iceCandidates: Array<Record<string, string>>; // {key: value}s
    };
  }>;
};

export type Database = {
  rooms: Record<string, Room>; // id => room
};
