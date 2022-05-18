import { Room } from "./lib/types";
import { DB, MAX_INTERCONNECTED_CLIENTS } from "./lib/constants";
import { randomUUID } from "crypto";
import type { Socket } from "socket.io";

export default function (socket: Partial<Socket>) {
  // the socket is always connected
  const io = socket as Socket;

  const onCreateRoom = async function (data: { roomId: string; name: string }) {
    const { roomId, name } = data;
    const room: Room = {
      name,
      clients: {},
      connectionPairs: [],
    };
    DB.rooms[roomId] = room;
  };

  const onJoinRoom = async function ({
    roomId,
    clientId,
    clientName,
  }: {
    roomId: string;
    clientId: string;
    clientName: string;
  }) {
    // join the socket to the room
    io.join(roomId);

    const room = DB.rooms[roomId];

    room.clients[clientId] = {
      id: clientId,
      name: clientName,
      peers: [],
    };

    if (room.connectionPairs.length == 0) {
      // create n - 1 pairs to connect to the other clients
      for (let i = 0; i < MAX_INTERCONNECTED_CLIENTS - 1; i++) {
        const peerId = randomUUID();

        // send request offer
        io.emit("request-offer", {
          peerId,
        });

        // save peerId
        room.connectionPairs.push({
          initiator: {
            clientId,
            id: peerId,
            sdpOffer: null,
            iceCandidates: [],
          },
        });
      }
    } else {
      // create n - 1 pairs to connect to the other clients
      let connectedClientIds: string[] = [];
      let numberOfPeersRemaining = MAX_INTERCONNECTED_CLIENTS - 1;

      for (let i = 0; i < room.connectionPairs.length; i++) {
        const peerId = randomUUID();

        const currentPair = room.connectionPairs[i];

        // do not connect :
        //  - if the client is already connected
        //  - and if the responder is already connected
        if (
          !connectedClientIds.includes(currentPair.initiator.clientId) &&
          currentPair.responder === undefined
        ) {
          // update the peerId
          connectedClientIds.push(currentPair.initiator.clientId);
          numberOfPeersRemaining--;

          // send request offer
          if (currentPair.initiator.sdpOffer !== null) {
            io.emit(`send-answer-request`, {
              peerId,
            });
          }

          // modify directly the connectionPair
          room.connectionPairs[i] = {
            ...room.connectionPairs[i],
            responder: {
              clientId,
              id: peerId,
              sdpAnswer: null,
              iceCandidates: [],
            },
          };
        }
      }

      for (let i = 0; i < numberOfPeersRemaining; i++) {
        const peerId = randomUUID();

        // send request offer
        io.emit("request-offer", {
          peerId,
        });

        // save peerId
        room.connectionPairs.push({
          initiator: {
            clientId,
            id: peerId,
            sdpOffer: null,
            iceCandidates: [],
          },
        });
      }
    }

    return;
  };

  const onOffer = async function ({
    peerId,
    sdpOffer,
    candidates,
  }: {
    peerId: string;
    sdpOffer: object;
    candidates: object[];
  }) {
    const roomId = [...io.rooms!][1];
    const room = DB.rooms[roomId];

    const connectionPair = room.connectionPairs.find(
      ({ initiator }) => initiator.id === peerId && initiator.sdpOffer === null
    )!;

    connectionPair.initiator.sdpOffer = sdpOffer;
    connectionPair.initiator.iceCandidates = candidates;

    io.to(roomId).emit("send-offer", {
      peerId,
      sdpOffer,
    });
  };

  // onAnswer
  // onDisconnect

  return {
    onCreateRoom,
    onJoinRoom,
    onOffer,
  };
}
