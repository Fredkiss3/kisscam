/// <reference types="jest" />

import { MAX_INTERCONNECTED_CLIENTS, DB } from "./../src/lib/constants";
import handlers from "../src/handlers";
import { randomUUID } from "crypto";
import { range } from "../src/lib/functions";
import { ConnectionPair, SocketClientEvent } from "../src/lib/types";

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
      id: "socket-id", // socket id
    });

    // when
    await onJoinRoom({
      roomId: "room-id",
      clientName: "client-name",
    });

    // then
    const requestSents = DB.rooms["room-id"].connectionPairs.length;
    expect(requestSents).toBe(MAX_INTERCONNECTED_CLIENTS - 1);
    expect(emitMock.mock.calls).toHaveLength(MAX_INTERCONNECTED_CLIENTS - 1);
    expect(emitMock.mock.calls[0][0]).toBe(SocketClientEvent.OfferRequested);
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
      id: "socket-id", // socket id
    });

    // when
    await onJoinRoom({
      roomId: "room-id",
      clientName: "client-name",
    });

    // then
    expect(joinMock).toHaveBeenCalledWith(`room-id`);
  });

  it("Should create a room when a client requests it", async () => {
    // Given
    DB.rooms = {};
    const { onCreateRoom } = handlers({
      join: jest.fn(),
      emit: jest.fn(),
      id: "socket-id", // socket id
    });

    // when
    await onCreateRoom(`New room`);

    // then
    expect(Object.keys(DB.rooms)).toHaveLength(1);
  });

  it("Should emit `room-created` message to the client that created the room", async () => {
    // Given
    DB.rooms = {};

    const emitMock = jest.fn();
    const { onCreateRoom } = handlers({
      join: jest.fn(),
      emit: emitMock,
      id: "client-id", // socket id
    });

    // when
    await onCreateRoom(`New room`);

    // then
    expect(emitMock).toBeCalledWith(SocketClientEvent.RoomCreated, {
      roomId: expect.any(String),
    });
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
      id: "socket-id", // socket id
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
      id: "client-2", // socket id
    });
    await onJoinRoom({
      roomId: "room-id",
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

  it("Should emit `answer-requested` messages to the client when an offer exists", async () => {
    // Given
    const pairs: ConnectionPair[] = range(
      0,
      MAX_INTERCONNECTED_CLIENTS - 1
    ).map((i) => ({
      initiator: {
        clientId: "client-1",
        id: `initiator`,
        sdpOffer: {
          type: "offer",
        },
        iceCandidates: [
          {
            candidate: "candidate",
          },
        ],
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
      id: "socket-2", // socket id
    });

    // when
    await onJoinRoom({
      roomId: "room-id",
      clientName: "jane",
    });

    // then
    expect(emitMock.mock.calls[0][0]).toBe(SocketClientEvent.AnswerRequested);
    expect(emitMock.mock.calls[0][1]).toHaveProperty(`peerId`);
    expect(emitMock.mock.calls[0][1]).toMatchObject({
      sdpOffer: {
        type: "offer",
      },
      iceCandidates: [
        {
          candidate: "candidate",
        },
      ],
    });
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
      id: "client-2", // socket id
    });
    await onJoinRoom({
      roomId: "room-id",
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
      id: "socket-2", // socket id
    });
    await onJoinRoom({
      roomId: "room-id",
      clientName: "jane",
    });

    // then
    expect(emitMock.mock.calls).toHaveLength(MAX_INTERCONNECTED_CLIENTS - 2);
    expect(emitMock.mock.calls[0][0]).toBe(SocketClientEvent.OfferRequested);
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
      id: "client-3", // socket id
    });
    await onJoinRoom({
      roomId: "room-id",
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

  it("Should update the connectionPair in the room when the responder send an answer", async () => {
    // Given
    const pairs: ConnectionPair[] = [
      {
        initiator: {
          clientId: "client-1",
          id: `initiator`,
          sdpOffer: {
            type: "offer",
          },
          iceCandidates: [],
        },
        responder: {
          clientId: "client-2",
          id: `responder`,
          sdpAnswer: null,
          iceCandidates: [
            {
              candidate: "candidate",
            },
          ],
        },
      },
    ];

    DB.rooms = {
      "room-id": {
        name: "room-id",
        clients: {
          "client-1": {
            id: "client-1",
            name: "john",
            peers: range(0, MAX_INTERCONNECTED_CLIENTS - 1).map((i) => ({
              id: `initiator-${i}`,
              clientId: "client-1",
            })),
          },
        },
        connectionPairs: pairs,
      },
    };

    const { onAnswer } = handlers({
      join: jest.fn(),
      emit: jest.fn(),
      rooms: new Set(["client-2", "room-id"]),
      id: "client-2", // socket id
      // @ts-ignore
      to: () => ({
        emit: jest.fn(),
      }),
    });

    // when
    await onAnswer({
      peerId: "responder",
      sdpAnswer: {
        type: "answer",
      },
      candidates: [
        {
          candidate: "candidate",
        },
      ],
    });

    // then
    expect(pairs).toHaveLength(1);
    expect(pairs[0].responder?.sdpAnswer).not.toBeNull();
    expect(pairs[0].responder?.iceCandidates).toHaveLength(1);
  });

  it("Should emit `save-answer` request to the initiator client when an answer has been sent", async () => {
    // Given
    const pairs: ConnectionPair[] = [
      {
        initiator: {
          clientId: "client-1",
          id: `initiator`,
          sdpOffer: {
            type: "offer",
          },
          iceCandidates: [],
        },
        responder: {
          clientId: "client-2",
          id: `responder`,
          sdpAnswer: null,
          iceCandidates: [
            {
              candidate: "candidate",
            },
          ],
        },
      },
    ];

    DB.rooms = {
      "room-id": {
        name: "room-id",
        clients: {
          "client-1": {
            id: "client-1",
            name: "john",
            peers: [
              {
                id: `initiator`,
                clientId: "client-1",
              },
            ],
          },
          "client-2": {
            id: "client-2",
            name: "jane",
            peers: [
              {
                id: `responder`,
                clientId: "client-2",
              },
            ],
          },
        },
        connectionPairs: pairs,
      },
    };

    // when
    const emitMock = jest.fn();
    const toMock = jest.fn(() => ({
      emit: emitMock,
    }));
    const { onAnswer } = handlers({
      join: jest.fn(),
      emit: jest.fn(),
      rooms: new Set(["client-2", "room-id"]),
      id: "client-2", // socket id
      // @ts-ignore
      to: toMock,
    });
    // when
    await onAnswer({
      peerId: "responder",
      sdpAnswer: {
        type: "answer",
      },
      candidates: [
        {
          candidate: "candidate",
        },
      ],
    });

    // then
    expect(toMock).toBeCalledWith(`client-1`);
    expect(emitMock.mock.calls).toHaveLength(1);
    expect(emitMock.mock.calls[0][0]).toBe(SocketClientEvent.AnswerSent);
    expect(emitMock.mock.calls[0][1]).toMatchObject({
      peerId: "responder",
      sdpAnswer: {
        type: "answer",
      },
      candidates: [
        {
          candidate: "candidate",
        },
      ],
    });
  });

  it("Should emit `offer-sent` to the room when the peer send an offer", async () => {
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
      id: "socket-id", // socket id
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
    expect(emitMock).toHaveBeenCalledWith(SocketClientEvent.OfferSent, {
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
  });

  it("Should not emit any messages when an offer is sent but the initiator does not exists", async () => {
    // Given

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
        connectionPairs: [],
      },
    };

    const emitMock = jest.fn();
    const { onOffer } = handlers({
      id: "socket-id", // socket id
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
    expect(emitMock).not.toBeCalled();
  });

  it("Should not emit any messages to the initiator client when an answer has been sent but the responder does exists", async () => {
    // Given
    const pairs: ConnectionPair[] = [
      {
        initiator: {
          clientId: "client-1",
          id: `initiator`,
          sdpOffer: {
            type: "offer",
          },
          iceCandidates: [],
        },
      },
    ];

    DB.rooms = {
      "room-id": {
        name: "room-id",
        clients: {
          "client-1": {
            id: "client-1",
            name: "john",
            peers: [
              {
                id: `initiator`,
                clientId: "client-1",
              },
            ],
          },
          "client-2": {
            id: "client-2",
            name: "jane",
            peers: [
              {
                id: `responder`,
                clientId: "client-2",
              },
            ],
          },
        },
        connectionPairs: pairs,
      },
    };

    // when
    const emitMock = jest.fn();
    const toMock = jest.fn(() => ({
      emit: emitMock,
    }));
    const { onAnswer } = handlers({
      join: jest.fn(),
      emit: jest.fn(),
      rooms: new Set(["client-2", "room-id"]),
      id: "client-2", // socket id
      // @ts-ignore
      to: toMock,
    });
    // when
    await onAnswer({
      peerId: "responder",
      sdpAnswer: {
        type: "answer",
      },
      candidates: [
        {
          candidate: "candidate",
        },
      ],
    });

    // then
    expect(emitMock).not.toBeCalled();
    expect(toMock).not.toBeCalled();
  });

  it("Should remove all the connections to a client when it disconnects if the client is an iniator", async () => {
    // Given
    const pairs: ConnectionPair[] = [
      {
        initiator: {
          clientId: "client-1",
          id: `initiator`,
          sdpOffer: {
            type: "offer",
          },
          iceCandidates: [
            {
              candidate: "candidate",
            },
          ],
        },
        responder: {
          clientId: "client-2",
          id: `responder`,
          sdpAnswer: {
            type: "offer",
          },
          iceCandidates: [
            {
              candidate: "candidate",
            },
          ],
        },
      },
      {
        initiator: {
          clientId: "client-1",
          id: `initiator`,
          sdpOffer: {
            type: "offer",
          },
          iceCandidates: [
            {
              candidate: "candidate",
            },
          ],
        },
      },
    ];

    DB.rooms = {
      "room-id": {
        name: "room-id",
        clients: {
          "client-1": {
            id: "client-1",
            name: "john",
            peers: [
              {
                id: `initiator`,
                clientId: "client-1",
              },
            ],
          },
          "client-2": {
            id: "client-2",
            name: "jane",
            peers: [
              {
                id: `responder`,
                clientId: "client-2",
              },
            ],
          },
        },
        connectionPairs: pairs,
      },
    };

    // when
    const { onDisconnect } = handlers({
      join: jest.fn(),
      emit: jest.fn(),
      rooms: new Set(["client-1", "room-id"]),
      id: "client-1", // socket id
      // @ts-ignore
      to: () => ({
        emit: jest.fn(),
      }),
    });
    // when
    await onDisconnect({
      roomId: "room-id",
      server: {
        // @ts-ignore
        to: () => {
          return {
            emit: jest.fn(),
          };
        },
        sockets: {
          // @ts-ignore
          in: () => ({
            emit: jest.fn(),
          }),
        },
      },
    });

    // then
    // we check that all the connections with the client-1 as the initiator have been removed
    expect(DB.rooms[`room-id`].connectionPairs).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          initiator: expect.objectContaining({
            clientId: "client-1",
          }),
        }),
      ])
    );
    expect(DB.rooms[`room-id`].clients).not.toHaveProperty(`client-1`);
  });

  it(`Should set all the responders that are where connected to an initiator to initiator when the initiator disconnects`, async () => {
    // Given
    const pairs: ConnectionPair[] = [
      {
        initiator: {
          clientId: "client-1",
          id: `initiator`,
          sdpOffer: {
            type: "offer",
          },
          iceCandidates: [
            {
              candidate: "candidate",
            },
          ],
        },
        responder: {
          clientId: "client-2",
          id: `responder`,
          sdpAnswer: {
            type: "offer",
          },
          iceCandidates: [
            {
              candidate: "candidate",
            },
          ],
        },
      },
      {
        initiator: {
          clientId: "client-1",
          id: `initiator`,
          sdpOffer: {
            type: "offer",
          },
          iceCandidates: [
            {
              candidate: "candidate",
            },
          ],
        },
      },
    ];

    DB.rooms = {
      "room-id": {
        name: "room-id",
        clients: {
          "client-1": {
            id: "client-1",
            name: "john",
            peers: [
              {
                id: `initiator`,
                clientId: "client-1",
              },
            ],
          },
          "client-2": {
            id: "client-2",
            name: "jane",
            peers: [
              {
                id: `responder`,
                clientId: "client-2",
              },
            ],
          },
        },
        connectionPairs: pairs,
      },
    };

    // when
    const { onDisconnect } = handlers({
      join: jest.fn(),
      emit: jest.fn(),
      rooms: new Set(["client-1", "room-id"]),
      id: "client-1", // socket id
      // @ts-ignore
      to: () => ({
        emit: jest.fn(),
      }),
    });
    // when
    await onDisconnect({
      roomId: "room-id",
      server: {
        // @ts-ignore
        to: () => {
          return {
            emit: jest.fn(),
          };
        },
        sockets: {
          // @ts-ignore
          in: () => ({
            emit: jest.fn(),
          }),
        },
      },
    });

    // then
    expect(DB.rooms[`room-id`].connectionPairs[0]).toMatchObject({
      initiator: {
        clientId: "client-2",
        id: `responder`,
        sdpOffer: null,
        iceCandidates: [],
      },
    });
  });

  it(`Should emit a 'disconnected' message to all the clients when anyone disconnects`, async () => {
    // Given
    const pairs: ConnectionPair[] = [
      {
        initiator: {
          clientId: "client-1",
          id: `initiator`,
          sdpOffer: {
            type: "offer",
          },
          iceCandidates: [
            {
              candidate: "candidate",
            },
          ],
        },
        responder: {
          clientId: "client-2",
          id: `responder`,
          sdpAnswer: {
            type: "offer",
          },
          iceCandidates: [
            {
              candidate: "candidate",
            },
          ],
        },
      },
      {
        initiator: {
          clientId: "client-2",
          id: `initiator-2`,
          sdpOffer: {
            type: "offer",
          },
          iceCandidates: [
            {
              candidate: "candidate",
            },
          ],
        },
        responder: {
          clientId: "client-1",
          id: `responder-2`,
          sdpAnswer: {
            type: "answer",
          },
          iceCandidates: [
            {
              candidate: "candidate",
            },
          ],
        },
      },
    ];

    DB.rooms = {
      "room-id": {
        name: "room-id",
        clients: {
          "client-1": {
            id: "client-1",
            name: "john",
            peers: [
              {
                id: `initiator`,
                clientId: "client-1",
              },
              {
                id: `responder-2`,
                clientId: "client-1",
              },
            ],
          },
          "client-2": {
            id: "client-2",
            name: "jane",
            peers: [
              {
                id: `responder`,
                clientId: "client-2",
              },
            ],
          },
        },
        connectionPairs: pairs,
      },
    };

    // when
    const emitMock = jest.fn();
    const { onDisconnect } = handlers({
      join: jest.fn(),
      emit: jest.fn(),
      rooms: new Set(["client-1", "room-id"]),
      id: "client-1", // socket id
      // @ts-ignore
      to: () => ({
        emit: jest.fn(),
      }),
    });

    // when
    await onDisconnect({
      roomId: "room-id",
      server: {
        // @ts-ignore
        to: () => {
          return {
            emit: jest.fn(),
          };
        },
        sockets: {
          // @ts-ignore
          in: () => ({
            emit: emitMock,
          }),
        },
      },
    });

    // then
    expect(emitMock.mock.calls).toHaveLength(1);
    expect(emitMock.mock.calls[0][0]).toBe(SocketClientEvent.Disconnected);
    expect(emitMock.mock.calls[0][1]).toEqual([`initiator`, `responder-2`]);
  });

  it(`Should delete the room when the last client disconnects`, async () => {
    DB.rooms = {
      "room-id": {
        name: "room-id",
        clients: {
          "client-1": {
            id: "client-1",
            name: "john",
            peers: [],
          },
        },
        connectionPairs: [],
      },
    };

    // when
    const { onDisconnect } = handlers({
      join: jest.fn(),
      emit: jest.fn(),
      rooms: new Set(["client-1", "room-id"]),
      id: "client-1", // socket id
      // @ts-ignore
      to: () => ({
        emit: jest.fn(),
      }),
    });

    // when
    await onDisconnect({
      roomId: "room-id",
      server: {
        // @ts-ignore
        to: () => {
          return {
            emit: jest.fn(),
          };
        },
        sockets: {
          // @ts-ignore
          in: () => ({
            emit: jest.fn(),
          }),
        },
      },
    });

    // then
    expect(DB.rooms[`room-id`]).toBeUndefined();
  });

  it(`Should emit a 'create-offer' message to all the responders that are were connected to an initiator when the responders are turned to initiators`, async () => {
    // Given
    const pairs: ConnectionPair[] = [
      {
        initiator: {
          clientId: "client-1",
          id: `initiator-1`,
          sdpOffer: {
            type: "offer",
          },
          iceCandidates: [
            {
              candidate: "candidate",
            },
          ],
        },
        responder: {
          clientId: "client-2",
          id: `responder-1`,
          sdpAnswer: {
            type: "offer",
          },
          iceCandidates: [
            {
              candidate: "candidate",
            },
          ],
        },
      },
      {
        initiator: {
          clientId: "client-2",
          id: `initiator-2`,
          sdpOffer: {
            type: "offer",
          },
          iceCandidates: [
            {
              candidate: "candidate",
            },
          ],
        },
        responder: {
          clientId: "client-1",
          id: `responder-2`,
          sdpAnswer: {
            type: "answer",
          },
          iceCandidates: [
            {
              candidate: "candidate",
            },
          ],
        },
      },
    ];

    DB.rooms = {
      "room-id": {
        name: "room-id",
        clients: {
          "client-1": {
            id: "client-1",
            name: "john",
            peers: [
              {
                id: `initiator-1`,
                clientId: "client-1",
              },
              {
                id: `responder-2`,
                clientId: "client-1",
              },
            ],
          },
          "client-2": {
            id: "client-2",
            name: "jane",
            peers: [
              {
                id: `responder-1`,
                clientId: "client-2",
              },
              {
                id: `initiator-2`,
                clientId: "client-2",
              },
            ],
          },
        },
        connectionPairs: pairs,
      },
    };

    // when
    const emitMock = jest.fn();
    const toMock = jest.fn(() => {
      return {
        emit: emitMock,
      };
    });
    const { onDisconnect } = handlers({
      join: jest.fn(),
      emit: jest.fn(),
      id: "client-1", // socket id
      // @ts-ignore
      to: () => ({
        emit: jest.fn(),
      }),
    });

    // when
    await onDisconnect({
      roomId: "room-id",
      server: {
        // @ts-ignore
        to: toMock,
        sockets: {
          // @ts-ignore
          in: () => ({
            emit: jest.fn(),
          }),
        },
      },
    });

    // then
    // called only once
    expect(toMock.mock.calls).toHaveLength(1);
    expect(emitMock.mock.calls).toHaveLength(1);

    expect(toMock).toBeCalledWith(`client-2`);

    // contain all the responders that were connected to the initiator
    expect(emitMock).toBeCalledWith(SocketClientEvent.OfferRequested, {
      peerId: `responder-1`,
    });
  });

  it(`Should remove all the responders that correspond to a client that disconnected`, async () => {
    // Given
    const pairs: ConnectionPair[] = [
      {
        initiator: {
          clientId: "client-1",
          id: `initiator-1`,
          sdpOffer: {
            type: "offer",
          },
          iceCandidates: [
            {
              candidate: "candidate",
            },
          ],
        },
        responder: {
          clientId: "client-2",
          id: `responder-1`,
          sdpAnswer: {
            type: "offer",
          },
          iceCandidates: [
            {
              candidate: "candidate",
            },
          ],
        },
      },
      {
        initiator: {
          clientId: "client-2",
          id: `initiator-2`,
          sdpOffer: {
            type: "offer",
          },
          iceCandidates: [
            {
              candidate: "candidate",
            },
          ],
        },
      },
    ];

    DB.rooms = {
      "room-id": {
        name: "room-id",
        clients: {
          "client-1": {
            id: "client-1",
            name: "john",
            peers: [
              {
                id: `initiator-1`,
                clientId: "client-1",
              },
              {
                id: `responder-2`,
                clientId: "client-1",
              },
            ],
          },
          "client-2": {
            id: "client-2",
            name: "jane",
            peers: [
              {
                id: `responder-1`,
                clientId: "client-2",
              },
              {
                id: `initiator-2`,
                clientId: "client-2",
              },
            ],
          },
        },
        connectionPairs: pairs,
      },
    };

    // when
    const { onDisconnect } = handlers({
      join: jest.fn(),
      emit: jest.fn(),
      id: "client-2", // socket id
      // @ts-ignore
      to: () => ({
        emit: jest.fn(),
      }),
    });

    // when
    await onDisconnect({
      roomId: "room-id",
      server: {
        // @ts-ignore
        to: () => ({
          emit: jest.fn(),
        }),
        sockets: {
          // @ts-ignore
          in: () => ({
            emit: jest.fn(),
          }),
        },
      },
    });

    // then
    expect(DB.rooms["room-id"].connectionPairs).toHaveLength(1);
    // we check that all the connections with the client-2 as the initiator have been removed
    expect(DB.rooms[`room-id`].connectionPairs).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          responder: expect.objectContaining({
            clientId: "client-2",
          }),
        }),
      ])
    );
    expect(DB.rooms[`room-id`].clients).not.toHaveProperty(`client-2`);
  });
});
