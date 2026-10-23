import { currentProfile } from "@/lib/current-profile";
import { db } from "@/prisma/db";
import { NextResponse } from "next/server";

const ROLES = ["ADMIN", "MODERATOR", "GUEST"];

// Ambil server + members (beserta profile), diurutkan berdasarkan role
const loadServer = (serverId: string) =>
  db.orm.public.Server.where({ id: serverId })
    .include("members", (member) =>
      member.include("profile").orderBy((m) => m.role.asc()),
    )
    .first();

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ memberId: string }> },
) {
  try {
    const { memberId } = await params;
    const profile = await currentProfile();
    const { searchParams } = new URL(req.url);
    const { role } = await req.json();

    const serverId = searchParams.get("serverId");

    if (!profile) return new NextResponse("Unauthorized", { status: 401 });

    if (!serverId)
      return new NextResponse("Server ID is missing", { status: 400 });

    if (!memberId)
      return new NextResponse("Member ID is missing", { status: 400 });

    if (!ROLES.includes(role))
      return new NextResponse("Invalid role", { status: 400 });

    // 1. Hanya pemilik server yang boleh mengubah role
    const owned = await db.orm.public.Server.where({
      id: serverId,
      profileId: profile.id,
    }).first();

    if (!owned) return new NextResponse("Not Found", { status: 404 });

    // 2. Member harus ada di server ini dan bukan diri sendiri
    //    (menggantikan profileId: { not: profile.id })
    const member = await db.orm.public.Member.where({
      id: memberId,
      serverId,
    }).first();

    if (!member) return new NextResponse("Member not found", { status: 404 });

    if (member.profileId === profile.id)
      return new NextResponse("Cannot change your own role", { status: 400 });

    // 3. Update role
    await db.orm.public.Member.where({ id: memberId, serverId }).update({
      role,
    });

    const server = await loadServer(serverId);

    return NextResponse.json(server);
  } catch (error) {
    console.log("[MEMBERS_ID_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ memberId: string }> },
) {
  try {
    const { memberId } = await params;
    const profile = await currentProfile();
    const { searchParams } = new URL(req.url);

    const serverId = searchParams.get("serverId");

    if (!profile) return new NextResponse("Unauthorized", { status: 401 });

    if (!serverId)
      return new NextResponse("Server ID is missing", { status: 400 });

    if (!memberId)
      return new NextResponse("Member ID is missing", { status: 400 });

    // 1. Hanya pemilik server yang boleh mengeluarkan member
    const owned = await db.orm.public.Server.where({
      id: serverId,
      profileId: profile.id,
    }).first();

    if (!owned) return new NextResponse("Not Found", { status: 404 });

    // 2. Member harus ada di server ini dan bukan diri sendiri
    const member = await db.orm.public.Member.where({
      id: memberId,
      serverId,
    }).first();

    if (!member) return new NextResponse("Member not found", { status: 404 });

    if (member.profileId === profile.id)
      return new NextResponse("Cannot remove yourself", { status: 400 });

    // 3. Hapus member
    await db.orm.public.Member.where({
      id: memberId,
      serverId,
    }).delete();

    const server = await loadServer(serverId);

    return NextResponse.json(server);
  } catch (error) {
    console.log("[MEMBERS_ID_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
