import { InitialModal } from "@/components/modals/initial-modal";
import { initialProfile } from "@/lib/initial-profile";
import { db } from "@/prisma/db";
import { redirect } from "next/navigation";
import { Suspense } from "react";

const SetupContent = async () => {
  const profile = await initialProfile();

  if (!profile) return redirect("/sign-in");

  const server = await db.orm.public.Server.where((s) =>
    s.members.some((m) => m.profileId.eq(profile.id)),
  ).first();

  if (server) return redirect(`/servers/${server.id}`);

  return <InitialModal />;
};

const SetupPage = () => {
  return (
    <Suspense fallback={null}>
      <SetupContent />
    </Suspense>
  );
};

export default SetupPage;
