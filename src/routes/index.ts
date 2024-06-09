import fastify from "fastify";
import { reconcilerController } from "../controller";

const server = fastify();

const identifySchema = {
  body: {
    type: 'object',
    properties: {
      email: { type: 'string' },
      phoneNumber: { type: 'string' }
    },
    required: ["email","phoneNumber"] // Add any required fields here, if any
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: { type: 'object' }
      }
    }
  }
};

server.get("/", (request, reply) => {
  console.log("Health Check Success!");
  reply.status(200).send({ msg: "Health Check Successful!" });
});

server.post("/identify",{schema:identifySchema},reconcilerController.reconcile);

export default server;
