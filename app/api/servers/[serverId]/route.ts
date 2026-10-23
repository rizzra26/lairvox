import { currentProfile } from "@/lib/current-profile";
import { db } from "@/prisma/db";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ serverId: string }> },
) {
  try {
    const { serverId } = await params;
    const profile = await currentProfile();
    const { name, imageUrl } = await req.json();

    if (!profile) return new NextResponse("Unauthorized", { status: 401 });

    if (!serverId)
      return new NextResponse("Server ID is missing", { status: 400 });

    const server = await db.orm.public.Server.where({
      id: serverId,
      profileId: profile.id,
    }).update({
      name,
      imageUrl,
    });

    return NextResponse.json(server);
  } catch (error) {
    console.log("[SERVER_ID_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ serverId: string }> },
) {
  try {
    const { serverId } = await params;
    const profile = await currentProfile();

    if (!profile) return new NextResponse("Unauthorized", { status: 401 });

    if (!serverId)
      return new NextResponse("Server ID is missing", { status: 400 });

    const server = await db.orm.public.Server.where({
      id: serverId,
      profileId: profile.id,
    }).delete();

    return NextResponse.json(server);
  } catch (error) {
    console.log("[SERVERS_ID_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
