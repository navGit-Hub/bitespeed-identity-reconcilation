import { Prisma } from "@prisma/client";
import { client } from "../config";

class ReconcileDao {
  async identifyUpdateUsers(data: { email?: string; phoneNumber?: string }) {
    let contacts: any;

// todo: implement error handling and check whether null values should be stored as contact or not.
// todo: Since email and phone number is optional we can allow them to be added with a null value.
// todo: logic for null phone and emails.
 



    // When both email and phone numbers are provided the matching is done right but when either of them are null then the matching has to happen.

    // PhoneNumber or Email either of them might be null, but we can get the primaryId and then match the secondary records or we might get the secondary records and identify the primary record and match accordingly.

    if (!data.phoneNumber || !data.email) {

      const where: Prisma.ContactWhereInput = {
        ...(data.email ? { email: data.email } : {}),
        ...(data.phoneNumber ? { phoneNumber: data.phoneNumber } : {}),
      };

      const fuzzyRecord = await client.contact.findFirst({
        where,
      });

      if(!fuzzyRecord)
          throw new Error("No Contact Found!");

      // if fuzzy record not found add some logic here.

      if (!fuzzyRecord?.linkedId) {
        contacts = [
          fuzzyRecord,
          ...(await client.contact.findMany({
            where: {
              linkedId: fuzzyRecord?.id,
            },
            orderBy: {
              createdAt: "asc",
            },
          })),
        ];
      } else if (fuzzyRecord?.linkedId) {
        const primaryRecord = await client.contact.findUnique({
          where: { id: fuzzyRecord?.linkedId },
        });

        contacts = [
          primaryRecord,
          ...(await client.contact.findMany({
            where: {
              linkedId: fuzzyRecord?.linkedId,
            },
          })),
        ];
      }
    } else if (data.phoneNumber && data.email) {
      const OR = [
        ...(data.email ? [{ email: data.email }] : []),
        ...(data.phoneNumber ? [{ phoneNumber: data.phoneNumber }] : []),
      ];

      contacts = await client.contact.findMany({
        where: {
          OR,
        },
        orderBy: {
          createdAt: "asc",
        },
      });
    }

    console.log("contacts",contacts);

    if(!contacts)
      throw new Error("No contacts found");

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
      let newSecondaryRecordId: number | null = null;

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
      ) {
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

        // update newly created recordId here
        newSecondaryRecordId = contacts[contacts.length - 1]?.id;
      }

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
          if (
            !newSecondaryRecordId ||
            updatedContact.id !== newSecondaryRecordId
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
