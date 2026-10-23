import { NextApiRequest } from "next";

import { NextApiResponseServerIo } from "@/types";
import { currentProfile } from "@/lib/current-profile-pages";
import { db } from "@/prisma/db";

const loadDirectMessage = (directMessageId: string, conversationId: string) =>
  db.orm.public.DirectMessage.where({ id: directMessageId, conversationId })
    .include("member", (member) => member.include("profile"))
    .first();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponseServerIo,
) {
  if (req.method !== "DELETE" && req.method !== "PATCH") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const profile = await currentProfile(req);
    const { directMessageId, conversationId } = req.query;
    const { content } = req.body;

    if (!profile) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!conversationId) {
      return res.status(400).json({ error: "Conversation ID missing" });
    }

    const conversation = await db.orm.public.Conversation.where({
      id: conversationId as string,
    })
      .include("memberOne")
      .include("memberTwo")
      .first();

    const memberOne = conversation?.memberOne;
    const memberTwo = conversation?.memberTwo;

    if (
      !conversation ||
      !memberOne ||
      !memberTwo ||
      (memberOne.profileId !== profile.id && memberTwo.profileId !== profile.id)
    ) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const member = memberOne.profileId === profile.id ? memberOne : memberTwo;

    const directMessage = await loadDirectMessage(
      directMessageId as string,
      conversationId as string,
    );

    if (!directMessage || directMessage.deleted) {
      return res.status(404).json({ error: "Message not found" });
    }

    const isMessageOwner = directMessage.memberId === member.id;
    const isAdmin = member.role === "ADMIN";
    const isModerator = member.role === "MODERATOR";
    const canModify = isMessageOwner || isAdmin || isModerator;

    if (!canModify) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.method === "DELETE") {
      await db.orm.public.DirectMessage.where({
        id: directMessageId as string,
      }).update({
        fileUrl: null,
        content: "This message has been deleted.",
        deleted: true,
      });
    }

    if (req.method === "PATCH") {
      if (!isMessageOwner) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      await db.orm.public.DirectMessage.where({
        id: directMessageId as string,
      }).update({ content });
    }

    const updatedMessage = await loadDirectMessage(
      directMessageId as string,
      conversationId as string,
    );

    if (!updatedMessage) {
      return res.status(404).json({ error: "Message not found" });
    }

    const updateKey = `chat:${conversation.id}:messages:update`;

    res?.socket?.server?.io?.emit(updateKey, updatedMessage);

    return res.status(200).json(updatedMessage);
  } catch (error) {
    console.log("[MESSAGE_ID]", error);
    return res.status(500).json({ error: "Internal Error" });
  }
}
