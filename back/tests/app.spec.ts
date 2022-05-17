import { MAX_INTERCONNECTED_CLIENTS, DB } from "./../src/lib/constants";
import handlers from "../src/handlers";
import { Server } from "socket.io";

describe(`App`, () => {
  beforeEach(() => {
    DB.rooms = {};
  });

  it(`should emit ${MAX_INTERCONNECTED_CLIENTS} request offers when a client join a room and the Room is empty`, async () => {
    // Given
    DB.rooms = {
      "room-id": {
        name: "room-id",
        clients: {},
        connectionPairs: [],
      },
    };

    const emitMock = jest.fn();
    const { onJoinRoom } = handlers({
      emit: emitMock,
    });

    // when
    await onJoinRoom({
      roomId: "room-id",
      clientId: "client-id",
      clientName: "client-name",
    });

    // then
    const requestSents = DB.rooms["room-id"].connectionPairs.length;
    expect(requestSents).toBe(MAX_INTERCONNECTED_CLIENTS);
    expect(emitMock.mock.calls).toHaveLength(MAX_INTERCONNECTED_CLIENTS);
    expect(emitMock.mock.calls[0][0]).toBe(`request-offer`);
  });

  it("Should join the socket to the room when the client requests to join a room", async () => {
    // Given
    const joinMock = jest.fn();

    DB.rooms = {
      "room-id": {
        name: "room-id",
        clients: {},
        connectionPairs: [],
      },
    };

    const { onJoinRoom } = handlers({
      join: joinMock,
    });

    // when
    await onJoinRoom({
      roomId: "room-id",
      clientId: "client-id",
      clientName: "client-name",
    });

    // then
    expect(joinMock).toHaveBeenCalledWith(`room-id`);
  });

  it("Should create a room when a client requests it", async () => {
    // Given
    const { onCreateRoom } = handlers({});

    // when
    await onCreateRoom({
      roomId: "room-id",
      name: "room-name",
    });

    // then
    expect(DB.rooms["room-id"]).toBeDefined();
    expect(DB.rooms["room-id"].clients).not.toBeUndefined();
    expect(DB.rooms["room-id"].connectionPairs).not.toBeUndefined();
  });

  it("Should update the connectionPair in the room when the peer send an offer", async () => {
    // Given
    const pair = {
      initiator: {
        clientId: "client-id",
        id: "peer-id",
        sdpOffer: null,
        iceCandidates: [],
      },
    };

    DB.rooms = {
      "room-id": {
        name: "room-id",
        clients: {
          "client-id": {
            id: "client-id",
            name: "client-name",
            peers: [
              {
                id: "peer-id",
                clientId: "client-id",
              },
            ],
          },
        },
        connectionPairs: [pair],
      },
    };

    const emitMock = jest.fn();
    const { onOffer } = handlers({
      rooms: new Set([`socket-id`, `room-id`]),
      // @ts-ignore
      to: () => {
        return {
          emit: emitMock,
        };
      },
    });

    // when
    await onOffer({
      peerId: "peer-id",
      sdpOffer: {
        type: "offer",
      },
    });

    // then
    expect(pair.initiator.sdpOffer).toMatchObject({
      type: "offer",
    });
    expect(emitMock).toHaveBeenCalledWith(`send-offer`, {
      peerId: "peer-id",
      sdpOffer: {
        type: "offer",
      },
    });
  });
});
