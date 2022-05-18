/// <reference types="jest" />
import { MAX_INTERCONNECTED_CLIENTS, DB } from "./../src/lib/constants";
import handlers from "../src/handlers";
import { randomUUID } from "crypto";
import { range } from "../src/lib/functions";
import { ConnectionPair } from "../src/lib/types";

describe(`App`, () => {
  beforeEach(() => {
    DB.rooms = {};
  });

  it(`should emit ${
    MAX_INTERCONNECTED_CLIENTS - 1
  } request offers when a client join a room and the Room is empty`, async () => {
    // Given
    DB.rooms = {
      "room-id": {
        name: "room-id",
        clients: {},
        connectionPairs: [],
      },
    };

    const emitMock = jest.fn();
    const joinMock = jest.fn();
    const { onJoinRoom } = handlers({
      emit: emitMock,
      join: joinMock,
    });

    // when
    await onJoinRoom({
      roomId: "room-id",
      clientId: "client-id",
      clientName: "client-name",
    });

    // then
    const requestSents = DB.rooms["room-id"].connectionPairs.length;
    expect(requestSents).toBe(MAX_INTERCONNECTED_CLIENTS - 1);
    expect(emitMock.mock.calls).toHaveLength(MAX_INTERCONNECTED_CLIENTS - 1);
    expect(emitMock.mock.calls[0][0]).toBe(`request-offer`);
  });

  it("Should join the socket to the room when the client requests to join a room", async () => {
    // Given
    const emitMock = jest.fn();
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
      emit: emitMock,
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
      candidates: [
        {
          candidate: "candidate",
        },
      ],
    });

    // then
    expect(pair.initiator.sdpOffer).toMatchObject({
      type: "offer",
    });
    expect(pair.initiator.iceCandidates).toHaveLength(1);
    expect(emitMock).toHaveBeenCalledWith(`send-offer`, {
      peerId: "peer-id",
      sdpOffer: {
        type: "offer",
      },
    });
  });

  it(`Should create offers answers when a client join a room and an initiator already exists`, async () => {
    // Given
    const pairs = range(0, MAX_INTERCONNECTED_CLIENTS - 1).map(() => ({
      initiator: {
        clientId: "client-id",
        id: randomUUID(),
        sdpOffer: null,
        iceCandidates: [],
      },
    }));

    DB.rooms = {
      "room-id": {
        name: "room-id",
        clients: {
          "client-id": {
            id: "client-1",
            name: "john",
            peers: [
              {
                id: "peer-id",
                clientId: "client-id",
              },
            ],
          },
        },
        connectionPairs: pairs,
      },
    };

    // when
    const { onJoinRoom } = handlers({
      join: jest.fn(),
      emit: jest.fn(),
    });
    await onJoinRoom({
      roomId: "room-id",
      clientId: "client-2",
      clientName: "jane",
    });

    // then
    expect(DB.rooms["room-id"].connectionPairs[0].responder).toBeDefined();
    expect(DB.rooms["room-id"].connectionPairs[0].responder?.clientId).toBe(
      "client-2"
    );
    expect(
      DB.rooms["room-id"].connectionPairs[0].responder?.sdpAnswer
    ).toBeDefined();
  });

  it(`Should emit answer requests when offer to the room when an offer exists`, async () => {
    // Given
    const pairs: ConnectionPair[] = range(
      0,
      MAX_INTERCONNECTED_CLIENTS - 1
    ).map((i) => ({
      initiator: {
        clientId: "client-1",
        id: randomUUID(),
        sdpOffer: {
          type: "offer",
        },
        iceCandidates: [],
      },
    }));

    DB.rooms = {
      "room-id": {
        name: "room-id",
        clients: {
          "client-id": {
            id: "client-1",
            name: "john",
            peers: [
              {
                id: "peer-id",
                clientId: "client-id",
              },
            ],
          },
        },
        connectionPairs: pairs,
      },
    };

    const emitMock = jest.fn();
    const { onJoinRoom } = handlers({
      join: jest.fn(),
      emit: emitMock,
    });

    // when
    await onJoinRoom({
      roomId: "room-id",
      clientId: "client-2",
      clientName: "jane",
    });

    // then
    expect(emitMock.mock.calls[0][0]).toBe(`send-answer-request`);
    expect(emitMock.mock.calls[0][1]).toHaveProperty(`peerId`);
  });

  it(`Should create only one offer answer when a client join a room and ${
    MAX_INTERCONNECTED_CLIENTS - 1
  } initiators already exists for for one client`, async () => {
    // Given
    const pairs = range(0, MAX_INTERCONNECTED_CLIENTS - 1).map(() => ({
      initiator: {
        clientId: "client-id",
        id: randomUUID(),
        sdpOffer: null,
        iceCandidates: [],
      },
    }));

    DB.rooms = {
      "room-id": {
        name: "room-id",
        clients: {
          "client-id": {
            id: "client-1",
            name: "john",
            peers: [
              {
                id: "peer-id",
                clientId: "client-id",
              },
            ],
          },
        },
        connectionPairs: pairs,
      },
    };

    // when
    const emitMock = jest.fn();
    const joinMock = jest.fn();
    const { onJoinRoom } = handlers({
      join: joinMock,
      emit: emitMock,
    });
    await onJoinRoom({
      roomId: "room-id",
      clientId: "client-2",
      clientName: "jane",
    });

    // then

    // created a answer for the first initiator
    expect(DB.rooms["room-id"].connectionPairs[0].responder).toBeDefined();
    expect(DB.rooms["room-id"].connectionPairs[0].responder?.clientId).toBe(
      "client-2"
    );

    // did not create  a answer for the second initiator
    expect(DB.rooms["room-id"].connectionPairs[1].responder).toBeUndefined();
  });

  it(`Should emit a number of remaining offers requests when a client join a room and is already connected to all the clients who have offers`, async () => {
    // Given
    const pairs: ConnectionPair[] = range(
      0,
      MAX_INTERCONNECTED_CLIENTS - 1
    ).map((i) => ({
      initiator: {
        clientId: "client-1",
        id: randomUUID(),
        sdpOffer: null,
        iceCandidates: [],
      },
      responder:
        i !== 0
          ? undefined
          : {
              clientId: "client-2",
              id: randomUUID(),
              sdpAnswer: null,
              iceCandidates: [],
            },
    }));

    DB.rooms = {
      "room-id": {
        name: "room-id",
        clients: {
          "client-id": {
            id: "client-1",
            name: "john",
            peers: [
              {
                id: "peer-id",
                clientId: "client-id",
              },
            ],
          },
        },
        connectionPairs: pairs,
      },
    };

    // when
    const emitMock = jest.fn();
    const joinMock = jest.fn();
    const { onJoinRoom } = handlers({
      join: joinMock,
      emit: emitMock,
    });
    await onJoinRoom({
      roomId: "room-id",
      clientId: "client-2",
      clientName: "jane",
    });

    // then
    expect(emitMock.mock.calls).toHaveLength(MAX_INTERCONNECTED_CLIENTS - 2);
    expect(emitMock.mock.calls[0][0]).toBe(`request-offer`);
  });

  it("Should use all peers to create answers if there is enough initiators", async () => {
    // Given
    const pairs: ConnectionPair[] = [
      {
        initiator: {
          clientId: "client-1",
          id: `initiator-1`,
          sdpOffer: null,
          iceCandidates: [],
        },
        responder: {
          clientId: "client-2",
          id: `responder-1`,
          sdpAnswer: null,
          iceCandidates: [],
        },
      },
      {
        initiator: {
          clientId: "client-1",
          id: `initiator-2`,
          sdpOffer: null,
          iceCandidates: [],
        },
      },
      {
        initiator: {
          clientId: "client-2",
          id: `initiator-3`,
          sdpOffer: null,
          iceCandidates: [],
        },
      },
    ];

    DB.rooms = {
      "room-id": {
        name: "room-id",
        clients: {},
        connectionPairs: pairs,
      },
    };

    // when
    const { onJoinRoom } = handlers({
      join: jest.fn(),
      emit: jest.fn(),
    });
    await onJoinRoom({
      roomId: "room-id",
      clientId: "client-3",
      clientName: "jasmine",
    });

    // then
    expect(pairs).toHaveLength(3 + MAX_INTERCONNECTED_CLIENTS - 3);
    // created an answer for the second initiator
    expect(pairs[1].responder).toBeDefined();
    expect(pairs[1].responder?.clientId).toBe("client-3");

    // created an answer for the third initiator
    expect(pairs[2].responder).toBeDefined();
    expect(pairs[2].responder?.clientId).toBe("client-3");
  });
});
