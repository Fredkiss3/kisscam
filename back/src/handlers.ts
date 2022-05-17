import { Room } from "./lib/types";
import { DB, MAX_INTERCONNECTED_CLIENTS } from "./lib/constants";
import { randomUUID } from "crypto";
import type { Socket } from "socket.io";

export default function (io: Partial<Socket>) {
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
    io.join?.(roomId);

    const room = DB.rooms[roomId];

    room.clients[clientId] = {
      id: clientId,
      name: clientName,
      peers: [],
    };

    for (let i = 0; i < MAX_INTERCONNECTED_CLIENTS; i++) {
      const peerId = randomUUID();

      // send request offer
      io.emit?.("request-offer", {
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

    return;
  };

  const onOffer = async function ({
    peerId,
    sdpOffer,
  }: {
    peerId: string;
    sdpOffer: object;
  }) {
    const roomId = [...io.rooms!][1];
    const room = DB.rooms[roomId];

    const connectionPair = room.connectionPairs.find(
      ({ initiator }) => initiator.id === peerId && initiator.sdpOffer === null
    );

    // TODO: check if connectionPair is defined
    connectionPair!.initiator.sdpOffer = sdpOffer;

    // TODO check if all connectionPairs have sdpOffer
    io.to?.(roomId).emit?.("send-offer", {
      peerId,
      sdpOffer,
    });
  };

  return {
    onCreateRoom,
    onJoinRoom,
    onOffer,
  };
}
