import { v4 as uuidv4 } from "uuid";
import { currentProfile } from "@/lib/current-profile";
import { db } from "@/prisma/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { name, imageUrl } = await req.json();
    const profile = await currentProfile();

    if (!profile) return new NextResponse("Unauthorized", { status: 401 });

    const server = await db.transaction(async (tx) => {
      const created = await tx.orm.public.Server.create({
        profileId: profile.id,
        name,
        imageUrl,
        inviteCode: uuidv4(),
      });

      await tx.orm.public.Channel.create({
        name: "general",
        profileId: profile.id,
        serverId: created.id,
      });

      await tx.orm.public.Member.create({
        profileId: profile.id,
        serverId: created.id,
        role: "ADMIN",
      });

      return created;
    });

    return NextResponse.json(server);
  } catch (error) {
    console.log("[SERVERS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
