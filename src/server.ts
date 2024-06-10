import server from "./routes";
import cors from "@fastify/cors";

// @fastify/cors for cross site requests
(async () => await server.register(cors))();

// @fastify/formbody for validating request body
server.register(require("@fastify/formbody"));

server.listen({ port: 4000, host: "0.0.0.0" }, (err, address) => {
  if (err) {
    console.log(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});
