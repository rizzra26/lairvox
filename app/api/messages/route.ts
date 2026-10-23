import { NextResponse } from "next/server";

import { currentProfile } from "@/lib/current-profile";
import { db } from "@/prisma/db";

const MESSAGES_BATCH = 10;

export async function GET(req: Request) {
  try {
    const profile = await currentProfile();
    const { searchParams } = new URL(req.url);

    const cursor = searchParams.get("cursor");
    const channelId = searchParams.get("channelId");

    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!channelId) {
      return new NextResponse("Channel ID missing", { status: 400 });
    }

    const query = db.orm.public.Message.where({ channelId })
      .include("member", (member) => member.include("profile"))
      .orderBy([(m) => m.createdAt.desc(), (m) => m.id.desc()]);

    let page = query;

    if (cursor) {
      const cursorMessage = await db.orm.public.Message.where({
        id: cursor,
        channelId,
      }).first();

      if (!cursorMessage) {
        return new NextResponse("Invalid cursor", { status: 400 });
      }

      page = query.cursor({
        createdAt: cursorMessage.createdAt,
        id: cursorMessage.id,
      });
    }

    const messages = await page.limit(MESSAGES_BATCH).all();

    let nextCursor: string | null = null;

    if (messages.length === MESSAGES_BATCH) {
      nextCursor = messages[MESSAGES_BATCH - 1].id;
    }

    return NextResponse.json({
      items: messages,
      nextCursor,
    });
  } catch (error) {
    console.log("[MESSAGES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
