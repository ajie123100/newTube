import { useMemo } from "react";
import { VideoGetOneOutput } from "../../types";
import { VideoDescription } from "./video-description";
import { VideoMenu } from "./video-menu";
import { VideoOwner } from "./video-owner";
import { VideoReactions } from "./video-reactions";
import { format, formatDistanceToNow } from "date-fns";

interface VideoTopRowProps {
  video: VideoGetOneOutput;
}

export const VideoTopRow = ({ video }: VideoTopRowProps) => {
  const compactViews = useMemo(() => {
    return new Intl.NumberFormat("en", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(1000);
  }, []);
  const expandedViews = useMemo(() => {
    return new Intl.NumberFormat("en", {
      notation: "standard",
      maximumFractionDigits: 1,
    }).format(1000);
  }, []);
  const compactDate = useMemo(() => {
    return formatDistanceToNow(video.createdAt, {
      addSuffix: true,
    });
  }, [video.createdAt]);
  const expandedDate = useMemo(() => {
    return format(video.createdAt, "MMMM dd, yyyy");
  }, [video.createdAt]);
  return (
    <div className="flex flex-col gap-4 mt-4">
      <h1 className="text-xl font-semibold">{video.title}</h1>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <VideoOwner user={video.user} videoId={video.id} />
        <div className="flex overflow-x-auto sm:min-w-[calc(50%-6px)] sm:justify-end sm:overflow-visible pb-2 -mb-2 sm:pb-0 sm:mb-0 gap-2">
          <VideoReactions />
          <VideoMenu
            videoId={video.id}
            variant="secondary"
            onRemove={() => {}}
          />
        </div>
      </div>
      <VideoDescription
        compactViews={compactViews}
        expandedViews={expandedViews}
        compactDate={compactDate}
        expandedDate={expandedDate}
        description={video.description ?? undefined}
      />
    </div>
  );
};
