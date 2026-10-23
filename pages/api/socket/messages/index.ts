import { NextApiRequest } from "next";

import { NextApiResponseServerIo } from "@/types";
import { currentProfile } from "@/lib/current-profile-pages";
import { db } from "@/prisma/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponseServerIo,
) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const profile = await currentProfile(req);
    const { content, fileUrl } = req.body;
    const { serverId, channelId } = req.query;

    if (!profile) return res.status(401).json({ error: "Unauthorized" });

    if (!serverId) return res.status(400).json({ error: "Server ID missing" });

    if (!channelId)
      return res.status(400).json({ error: "Channel ID missing" });

    if (!content) return res.status(400).json({ error: "Content missing" });

    const member = await db.orm.public.Member.where({
      serverId: serverId as string,
      profileId: profile.id,
    }).first();

    if (!member) return res.status(404).json({ message: "Server not found" });

    const channel = await db.orm.public.Channel.where({
      id: channelId as string,
      serverId: serverId as string,
    }).first();

    if (!channel) return res.status(404).json({ message: "Channel not found" });

    const created = await db.orm.public.Message.create({
      content,
      fileUrl,
      channelId: channelId as string,
      memberId: member.id,
    });

    const message = await db.orm.public.Message.where({ id: created.id })
      .include("member", (m) => m.include("profile"))
      .first();

    if (!message) return res.status(500).json({ message: "Internal Error" });

    const channelKey = `chat:${channelId}:messages`;

    res?.socket?.server?.io?.emit(channelKey, message);

    return res.status(200).json(message);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Error" });
  }
}
