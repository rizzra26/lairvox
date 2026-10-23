import { Server as NetServer, Socket } from "net";
import { NextApiResponse } from "next";
import { Server as SocketIOServer } from "socket.io";
import type { FieldOutputTypes } from "@/prisma/contract";

export type Server = FieldOutputTypes["public"]["Server"];
export type Channel = FieldOutputTypes["public"]["Channel"];
export type Member = FieldOutputTypes["public"]["Member"];
export type Profile = FieldOutputTypes["public"]["Profile"];
export type Message = FieldOutputTypes["public"]["Message"];
export type DirectMessage = FieldOutputTypes["public"]["DirectMessage"];

export type ServerWithMembersWithProfiles = Server & {
  members: (Member & { profile: Profile })[];
};

export type MemberWithProfile =
  ServerWithMembersWithProfiles["members"][number];

export type MemberRoleType = MemberWithProfile["role"];

export type NextApiResponseServerIo = NextApiResponse & {
  socket: Socket & {
    server: NetServer & {
      io: SocketIOServer;
    };
  };
};
