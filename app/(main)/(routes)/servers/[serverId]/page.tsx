import { currentProfile } from "@/lib/current-profile";
import { db } from "@/prisma/db";
import { redirect } from "next/navigation";

interface ServerIdPageProps {
  params: Promise<{ serverId: string }>;
}

const ServerIdPage = async ({ params }: ServerIdPageProps) => {
  const profile = await currentProfile();
  const { serverId } = await params;

  if (!profile) return redirect("/sign-in");

  const server = await db.orm.public.Server.where({ id: serverId })
    .where((s) => s.members.some((m) => m.profileId.eq(profile.id)))
    .include("channels", (channel) => channel.orderBy((c) => c.createdAt.asc()))
    .include("members", (member) =>
      member.include("profile").orderBy((m) => m.role.asc()),
    )
    .first();

  const channel = server?.channels[0];

  if (channel?.name !== "general") return null;

  return redirect(`/servers/${server?.id}/channels/${channel.id}`);
};

export default ServerIdPage;
