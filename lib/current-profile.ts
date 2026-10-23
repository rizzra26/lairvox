import { auth } from "@clerk/nextjs/server";
import { db } from "@/prisma/db";

export const currentProfile = async () => {
  const { userId } = await auth();

  if (!userId) return null;

  const profile = await db.orm.public.Profile.where((p) => {
    return p.userId.eq(userId);
  }).first();

  return profile;
};
