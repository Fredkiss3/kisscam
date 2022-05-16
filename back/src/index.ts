import Fastify from "fastify";
import fastifyIO from "fastify-socket.io";

const server = Fastify({});
server.register(fastifyIO);

server.get("/", (req, reply) => {
  server.io.emit("hello");
});

server.get("/ping", async (request, reply) => {
  return { pong: "it worked!" };
});

server.ready().then(() => {
  // we need to wait for the server to be ready, else `server.io` is undefined
  console.log("server ready");

  server.io.of("/").adapter.on("create-room", (room) => {
    console.log(`room ${room} was created`);
  });

  server.io.of("/").adapter.on("join-room", (room, id) => {
    console.log(`socket ${id} has joined room ${room}`);
  });

  server.io.on("connection", (socket) => {
    // ...
    console.log("socket connected");
    socket.emit("hello");

    socket.on("message", (event) => {
      socket.emit("message", event);
    });

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
