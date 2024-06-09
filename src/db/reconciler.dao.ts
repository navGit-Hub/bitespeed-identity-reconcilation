import { client } from "../config";

class ReconcileDao {
  async identifyUpdateUsers(data: { email?: string; phoneNumber?: string }) {
    const OR = [
      ...(data.email ? [{ email: data.email }] : []),
      ...(data.phoneNumber ? [{ phoneNumber: data.phoneNumber }] : []),
    ];

    const contacts = await client.contact.findMany({
      where: {
        OR,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // If more than one primary records are fetched then the earliest record has to be updated as the new primary record and other linkedId has to be updated accordingly.
    let res: {
      primaryLinkedId: number;
      emails: string[];
      phoneNumbers: string[];
      secondaryContacts: number[]; // adjust type as needed
    } = {
      // the 0th record should always be primary
      primaryLinkedId: contacts[0]?.id,
      emails: [],
      phoneNumbers: [],
      secondaryContacts: [],
    };
    if (contacts?.length > 0) {
      // There are matching records but if the request has a new combination i.e new information then create a new record
      if (
        data?.phoneNumber &&
        data?.email &&
        !(await client.contact.findUnique({
          where: {
            email_phoneNumber: {
              email: data?.email,
              phoneNumber: data?.phoneNumber,
            },
          },
        }))
      )
        // create and add the new contact to the contacts array.
        contacts.push(
          await client.contact.create({
            data: {
              email: data?.email,
              phoneNumber: data?.phoneNumber,
              linkPrecedence: "secondary",
              linkedId: res.primaryLinkedId,
            },
          })
        );

      let i = 0;

      for (let contact of contacts) {
        let updatedContact = contact;

        if (i === 0) {
          if (contact.linkPrecedence === "secondary") {
            // update linkPrecedence to primary & linkedId to null
            updatedContact = await client.contact.update({
              where: {
                id: contact.id,
              },
              data: {
                linkPrecedence: "primary",
                linkedId: null,
              },
            });
          }
        } else {
          if (res.primaryLinkedId && contact.linkedId != res.primaryLinkedId) {
            // update linkedId to primaryLinkedId

            updatedContact = await client.contact.update({
              where: {
                id: contact.id,
              },
              data: {
                linkedId: res.primaryLinkedId,
                linkPrecedence: "secondary",
              },
            });
          }
        }
        // update the response (res)

        if (
          updatedContact.email &&
          !res.emails.some((email) => updatedContact.email === email)
        )
          res.emails.push(updatedContact.email);

        if (
          updatedContact.phoneNumber &&
          !res.phoneNumbers.some(
            (phoneNumber) => updatedContact.phoneNumber === phoneNumber
          )
        )
          res.phoneNumbers.push(updatedContact.phoneNumber);

        if (
          contact.linkPrecedence &&
          updatedContact.linkPrecedence === "secondary"
        )
          res.secondaryContacts.push(updatedContact.id);

        i++;
      }
    } else {
      const contact = await client.contact.create({
        data: {
          email: data.email,
          phoneNumber: data.phoneNumber,
          linkPrecedence: "primary",
        },
      });

      res.primaryLinkedId = contact.id;

      if (contact.email) res.emails.push(contact.email);

      if (contact.phoneNumber) res.phoneNumbers.push(contact.phoneNumber);
    }

    return res;
  }
}

export default new ReconcileDao();
