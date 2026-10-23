import { ServerSidebar } from "@/components/server/server-sidebar";
import { currentProfile } from "@/lib/current-profile";
import { db } from "@/prisma/db";
import { redirect } from "next/navigation";

const ServerIdLayout = async ({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ serverId: string }>;
}) => {
  const profile = await currentProfile();
  const { serverId } = await params;

  if (!profile) return redirect("/sign-in");

  const server = await db.orm.public.Server.where({ id: serverId })
    .where((s) => s.members.some((m) => m.profileId.eq(profile.id)))
    .first();

  if (!server) redirect("/");

  return (
    <div className="h-full">
      <div className="max-md:hidden md:flex h-full w-60 z-20 flex-col fixed inset-y-0">
        <ServerSidebar serverId={serverId} />
      </div>
      <main className="h-full md:pl-60">{children}</main>
    </div>
  );
};

export default ServerIdLayout;
