import { getAuth } from "@clerk/nextjs/server";
import { db } from "@/prisma/db";
import { NextApiRequest } from "next";

export const currentProfile = async (req: NextApiRequest) => {
  const { userId } = getAuth(req);

  if (!userId) return null;

  const profile = await db.orm.public.Profile.where({ userId }).first();

  return profile;
};
