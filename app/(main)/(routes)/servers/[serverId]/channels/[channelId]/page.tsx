import { redirect } from "next/navigation";

import { currentProfile } from "@/lib/current-profile";
import { ChatHeader } from "@/components/chat/chat-header";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessages } from "@/components/chat/chat-messages";
import { MediaRoom } from "@/components/media-room";
import { db } from "@/prisma/db";

interface ChannelIdPageProps {
  params: Promise<{
    serverId: string;
    channelId: string;
  }>;
}

const ChannelIdPage = async ({ params }: ChannelIdPageProps) => {
  const profile = await currentProfile();
  const { serverId, channelId } = await params;

  if (!profile) {
    return redirect("/sign-in");
  }

  const channel = await db.orm.public.Channel.where({
    id: channelId,
  }).first();

  const member = await db.orm.public.Member.where({ serverId: serverId })
    .where({ profileId: profile.id })
    .first();

  if (!channel || !member) {
    redirect("/");
  }

  return (
    <div className="bg-white dark:bg-[#313338] flex flex-col h-full">
      <ChatHeader
        name={channel.name}
        serverId={channel.serverId}
        type="channel"
      />
      {channel.type === "TEXT" && (
        <>
          <ChatMessages
            member={member}
            name={channel.name}
            chatId={channel.id}
            type="channel"
            apiUrl="/api/messages"
            socketUrl="/api/socket/messages"
            socketQuery={{
              channelId: channel.id,
              serverId: channel.serverId,
            }}
            paramKey="channelId"
            paramValue={channel.id}
          />
          <ChatInput
            name={channel.name}
            type="channel"
            apiUrl="/api/socket/messages"
            query={{
              channelId: channel.id,
              serverId: channel.serverId,
            }}
          />
        </>
      )}
      {channel.type === "VOICE" && (
        <MediaRoom
          chatId={channel.id}
          video={false}
          audio={true}
          channelName={channel.name}
        />
      )}
      {channel.type === "VIDEO" && (
        <MediaRoom
          chatId={channel.id}
          video={true}
          audio={true}
          channelName={channel.name}
        />
      )}
    </div>
  );
};

export default ChannelIdPage;
