import { currentProfile } from "@/lib/current-profile";
import { db } from "@/prisma/db";
import { redirect } from "next/navigation";

interface InviteCodePageProps {
  params: Promise<{ inviteCode: string }>;
}

const InviteCodePage = async ({ params }: InviteCodePageProps) => {
  const profile = await currentProfile();
  const { inviteCode } = await params;

  if (!profile) return redirect("/sign-in");

  if (!inviteCode) return redirect("/");

  const alreadyJoin = await db.orm.public.Server.where({
    inviteCode: inviteCode,
  })
    .where((s) => s.members.some((m) => m.profileId.eq(profile.id)))
    .first();

  if (alreadyJoin) return redirect(`/servers/${alreadyJoin.id}`);

  const server = await db.orm.public.Server.where({
    inviteCode: inviteCode,
  }).update({
    members: (members) =>
      members.create([
        {
          profileId: profile.id,
        },
      ]),
  });

  if (server) return redirect(`/servers/${server.id}`);
  return null;
};

export default InviteCodePage;
