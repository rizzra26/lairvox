import { currentProfile } from "@/lib/current-profile";
import { db } from "@/prisma/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const profile = await currentProfile();
    const { name, type } = await req.json();
    const { searchParams } = new URL(req.url);
    const serverId = searchParams.get("serverId");

    if (!profile) return new NextResponse("Unauthorized", { status: 401 });

    if (!serverId)
      return new NextResponse("Server ID is missing", { status: 400 });

    if (name === "general")
      return new NextResponse("Channel Name cannot be 'general'", {
        status: 400,
      });

    const membership = await db.orm.public.Member.where({
      serverId,
      profileId: profile.id,
    }).first();

    if (!membership || !["ADMIN", "MODERATOR"].includes(membership.role)) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await db.orm.public.Channel.create({
      profileId: profile.id,
      name,
      type,
      serverId,
    });

    // 3. Kembalikan server, seperti hasil server.update sebelumnya
    const server = await db.orm.public.Server.where({ id: serverId }).first();

    return NextResponse.json(server);
  } catch (error) {
    console.log("[CHANNELS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
