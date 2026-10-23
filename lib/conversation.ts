import { db } from "@/prisma/db";

export const getOrCreateConversation = async (
  memberOneId: string,
  memberTwoId: string,
) => {
  let conversation =
    (await findConversation(memberOneId, memberTwoId)) ||
    (await findConversation(memberTwoId, memberOneId));

  if (!conversation) {
    conversation = await createNewConversation(memberOneId, memberTwoId);
  }

  return conversation;
};

const findConversation = async (memberOneId: string, memberTwoId: string) => {
  try {
    return await db.orm.public.Conversation.include("memberOne", (m1) =>
      m1.include("profile"),
    )
      .include("memberTwo", (m2) => m2.include("profile"))
      .where({ memberOneId, memberTwoId })
      .first();
  } catch {
    return null;
  }
};

const createNewConversation = async (
  memberOneId: string,
  memberTwoId: string,
) => {
  try {
    return await db.orm.public.Conversation.include("memberOne", (m1) =>
      m1.include("profile"),
    )
      .include("memberTwo", (m2) => m2.include("profile"))
      .create({
        memberOneId,
        memberTwoId,
      });
  } catch {
    return null;
  }
};
