import { NextResponse } from "next/server";

import { currentProfile } from "@/lib/current-profile";
import { db } from "@/prisma/db";

const CHANNEL_TYPES = ["TEXT", "VOICE", "VIDEO"];

const canManageChannels = async (serverId: string, profileId: string) => {
  const membership = await db.orm.public.Member.where({
    serverId,
    profileId,
  }).first();

  return !!membership && ["ADMIN", "MODERATOR"].includes(membership.role);
};

const findEditableChannel = async (channelId: string, serverId: string) => {
  const channel = await db.orm.public.Channel.where({
    id: channelId,
    serverId,
  }).first();

  if (!channel || channel.name === "general") return null;
  return channel;
};

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ channelId: string }> },
) {
  try {
    const { channelId } = await params;
    const profile = await currentProfile();
    const { searchParams } = new URL(req.url);

    const serverId = searchParams.get("serverId");

    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!serverId) {
      return new NextResponse("Server ID missing", { status: 400 });
    }

    if (!channelId) {
      return new NextResponse("Channel ID missing", { status: 400 });
    }

    if (!(await canManageChannels(serverId, profile.id))) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const channel = await findEditableChannel(channelId, serverId);

    if (!channel) {
      return new NextResponse("Channel not found", { status: 404 });
    }

    await db.orm.public.Channel.where({
      id: channelId,
      serverId,
    }).delete();

    const server = await db.orm.public.Server.where({ id: serverId }).first();

    return NextResponse.json(server);
  } catch (error) {
    console.log("[CHANNEL_ID_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ channelId: string }> },
) {
  try {
    const { channelId } = await params;
    const profile = await currentProfile();
    const { name, type } = await req.json();
    const { searchParams } = new URL(req.url);

    const serverId = searchParams.get("serverId");

    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!serverId) {
      return new NextResponse("Server ID missing", { status: 400 });
    }

    if (!channelId) {
      return new NextResponse("Channel ID missing", { status: 400 });
    }

    if (name === "general") {
      return new NextResponse("Name cannot be 'general'", { status: 400 });
    }

    if (!CHANNEL_TYPES.includes(type)) {
      return new NextResponse("Invalid channel type", { status: 400 });
    }

    if (!(await canManageChannels(serverId, profile.id))) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const channel = await findEditableChannel(channelId, serverId);

    if (!channel) {
      return new NextResponse("Channel not found", { status: 404 });
    }

    await db.orm.public.Channel.where({
      id: channelId,
      serverId,
    }).update({ name, type });

    const server = await db.orm.public.Server.where({ id: serverId }).first();

    return NextResponse.json(server);
  } catch (error) {
    console.log("[CHANNEL_ID_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
