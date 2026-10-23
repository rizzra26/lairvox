import { currentUser, auth } from "@clerk/nextjs/server";
import { db } from "@/prisma/db";

export const initialProfile = async () => {
  const { isAuthenticated, userId } = await auth();
  const user = await currentUser();

  // Redirect to sign in if there is no user logged in
  if (!isAuthenticated) {
    return null;
  }

  const profile = await db.orm.public.Profile.where({
    userId: userId || "",
  }).first();

  // if already have a profile
  if (profile) {
    return profile;
  }

  // create new profile
  try {
    return await db.orm.public.Profile.create({
      userId: userId as never,
      name: `${user?.firstName || user?.emailAddresses[0].emailAddress} ${user?.lastName || ""}`,
      imageUrl: user?.imageUrl as never,
      email: user?.emailAddresses[0].emailAddress as never,
    });
  } catch (error) {
    // concurrent call already created it between our SELECT and INSERT
    const existing = await db.orm.public.Profile.where({
      userId: userId || "",
    }).first();
    if (existing) return existing;
    throw error;
  }
};
