import { NextApiRequest } from "next";

import { NextApiResponseServerIo } from "@/types";
import { currentProfile } from "@/lib/current-profile-pages";
import { db } from "@/prisma/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponseServerIo,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const profile = await currentProfile(req);
    const { content, fileUrl } = req.body;
    const { conversationId } = req.query;

    if (!profile) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!conversationId) {
      return res.status(400).json({ error: "Conversation ID missing" });
    }

    if (!content) {
      return res.status(400).json({ error: "Content missing" });
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
      return res.status(404).json({ message: "Conversation not found" });
    }

    const member = memberOne.profileId === profile.id ? memberOne : memberTwo;

    const created = await db.orm.public.DirectMessage.create({
      content,
      fileUrl,
      conversationId: conversationId as string,
      memberId: member.id,
    });

    const message = await db.orm.public.DirectMessage.where({ id: created.id })
      .include("member", (m) => m.include("profile"))
      .first();

    if (!message) {
      return res.status(500).json({ message: "Internal Error" });
    }

    const channelKey = `chat:${conversationId}:messages`;

    res?.socket?.server?.io?.emit(channelKey, message);

    return res.status(200).json(message);
  } catch (error) {
    console.log("[DIRECT_MESSAGES_POST]", error);
    return res.status(500).json({ message: "Internal Error" });
  }
}
