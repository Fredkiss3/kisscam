import Fastify from "fastify";
import fastifyIO from "fastify-socket.io";
import cors from "@fastify/cors";

const server = Fastify({});

// Activate cors for all routes and all origins
server.register(cors, (instance) => {
  return (req, callback) => {
    callback(null, {
      origin: req.headers.origin as string,
    });
  };
});

// add the socket.io plugin
server.register(fastifyIO);

// room => Map of userId => socket
const DB: Record<string, Array<{ socketId: string }>> = {};

server.ready().then(() => {
  // we need to wait for the server to be ready, else `server.io` is undefined
  console.log("server ready");

  server.io.of("/").adapter.on("create-room", (room) => {
    console.log(`room ${room} was created`);
    DB[room] = [];
  });

  server.io.of("/").adapter.on("join-room", (room, id) => {
    DB[room].push({ socketId: id });
    console.log(`socket ${id} has joined room ${room}`);
    console.dir(DB);
  });

  server.io.on("connection", (socket) => {
    socket.on("question", (q: string) => {
      console.log(`socket ${socket.id} asked a question: ${q}`);
      socket.emit("answer", `i don't know, but i'm a teapot`);
    });
  });
});

const start = async () => {
  try {
    await server.listen(3000);

    const address = server.server.address();
    const port = typeof address === "string" ? address : address?.port;

    // @ts-ignore
    console.log(`Server listening at ${address?.address.toString()}:${port}`);
  } catch (err) {
    console.error(err);

    server.log.error(err);
    process.exit(1);
  }
};
start();
