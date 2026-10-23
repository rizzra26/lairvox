import { currentProfile } from "@/lib/current-profile";
import { db } from "@/prisma/db";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ serverId: string }> },
) {
  try {
    const { serverId } = await params;
    const profile = await currentProfile();

    if (!profile) return new NextResponse("Unauthorized", { status: 401 });

    if (!serverId)
      return new NextResponse("Server ID is missing", { status: 400 });

    const [server] = await db.orm.public.Server.where({
      id: serverId,
    }).all();

    if (!server) return new NextResponse("Server not found", { status: 404 });

    if (server.profileId === profile.id) {
      return new NextResponse("Owner cannot leave the server", { status: 400 });
    }

    const removed = await db.orm.public.Member.where({
      serverId: serverId,
      profileId: profile.id,
    }).delete();

    if (!removed) return new NextResponse("Not a member", { status: 404 });

    return NextResponse.json(server);
  } catch (error) {
    console.log("[SERVER_ID_LEAVE_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
