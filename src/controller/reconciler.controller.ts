import { FastifyReply, FastifyRequest } from "fastify";
import reconcilerDao from "../db/reconciler.dao";

class ReconcilerController {
  async reconcile(
    request: FastifyRequest<{
      Body: {
        email?: string;
        phoneNumber?: string;
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      // reconcilation logic

      const {email,phoneNumber} = request.body;

     if(!email && !phoneNumber)
    {
        reply.status(400).send({msg:"email or phoneNumber must be provided."})
        return;
    }

     const contact = await reconcilerDao.identifyUpdateUsers({email,phoneNumber});

      reply.status(200).send({contact});
    } catch (error: any) {
      console.log(error, "error caught!");

      reply.status(500).send({ message: error?.message, description:"Unexpected error occurred!"});
    }
  }
}

export default new ReconcilerController();
