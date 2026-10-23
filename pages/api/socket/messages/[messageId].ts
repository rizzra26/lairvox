import { NextApiRequest } from "next";

import { NextApiResponseServerIo } from "@/types";
import { currentProfile } from "@/lib/current-profile-pages";
import { db } from "@/prisma/db";

const loadMessage = (messageId: string, channelId: string) =>
  db.orm.public.Message.where({ id: messageId, channelId })
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
    const { messageId, serverId, channelId } = req.query;
    const { content } = req.body;

    if (!profile) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!serverId) {
      return res.status(400).json({ error: "Server ID missing" });
    }

    if (!channelId) {
      return res.status(400).json({ error: "Channel ID missing" });
    }

    const member = await db.orm.public.Member.where({
      serverId: serverId as string,
      profileId: profile.id,
    }).first();

    if (!member) {
      return res.status(404).json({ error: "Server not found" });
    }

    const channel = await db.orm.public.Channel.where({
      id: channelId as string,
      serverId: serverId as string,
    }).first();

    if (!channel) {
      return res.status(404).json({ error: "Channel not found" });
    }

    const message = await loadMessage(messageId as string, channelId as string);

    if (!message || message.deleted) {
      return res.status(404).json({ error: "Message not found" });
    }

    const isMessageOwner = message.memberId === member.id;
    const isAdmin = member.role === "ADMIN";
    const isModerator = member.role === "MODERATOR";
    const canModify = isMessageOwner || isAdmin || isModerator;

    if (!canModify) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.method === "DELETE") {
      await db.orm.public.Message.where({ id: messageId as string }).update({
        fileUrl: null,
        content: "This message has been deleted.",
        deleted: true,
      });
    }

    if (req.method === "PATCH") {
      if (!isMessageOwner) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      await db.orm.public.Message.where({ id: messageId as string }).update({
        content,
      });
    }

    const updatedMessage = await loadMessage(
      messageId as string,
      channelId as string,
    );

    if (!updatedMessage) {
      return res.status(404).json({ error: "Message not found" });
    }

    const updateKey = `chat:${channelId}:messages:update`;

    res?.socket?.server?.io?.emit(updateKey, updatedMessage);

    return res.status(200).json(updatedMessage);
  } catch (error) {
    console.log("[MESSAGE_ID]", error);
    return res.status(500).json({ error: "Internal Error" });
  }
}
