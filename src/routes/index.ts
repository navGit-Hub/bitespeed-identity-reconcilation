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
    required: ['email', 'phoneNumber'] // Specify required fields here if needed
  },
  response: {
    200: {
      type: 'object',
      properties: {
        contact: {
          type: 'object',
          properties: {
            primaryLinkedId: { type: 'number' },
            emails: {
              type: 'array',
              items: { type: 'string' }
            },
            phoneNumbers: {
              type: 'array',
              items: { type: 'string' }
            },
            secondaryContacts: {
              type: 'array',
              items: { type: 'number' }
            }
          },
          required: ['primaryLinkedId', 'emails', 'phoneNumbers', 'secondaryContacts']
        }
      },
      required: ['contact']
    }
  }
};

server.get("/", (request, reply) => {
  console.log("Health Check Success!");
  reply.status(200).send({ msg: "Health Check Successful!" });
});

server.post("/identify",{schema:identifySchema},reconcilerController.reconcile);

export default server;
