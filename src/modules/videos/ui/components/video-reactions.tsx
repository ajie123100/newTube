import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ThumbsDownIcon, ThumbsUpIcon } from "lucide-react";
import { VideoGetOneOutput } from "../../types";
import { useClerk } from "@clerk/nextjs";
import { trpc } from "@/trpc/client";
import { toast } from "sonner";

interface VideoReactionsProps {
  videoId: string;
  likes: number;
  dislikes: number;
  viewerReaction: VideoGetOneOutput["viewerReaction"];
}

const useVideoReaction = (videoId: string) => {
  const clerk = useClerk();
  const utils = trpc.useUtils();

  const handleError = (error: any) => {
    toast.error("Something went wrong");
    if (error.data?.code === "UNAUTHORIZED") {
      clerk.openSignIn();
    }
  };

  const handleSuccess = () => {
    utils.videos.getOne.invalidate({ id: videoId });
    utils.playlists.getLiked.invalidate();
  };

  const like = trpc.videoReaction.like.useMutation({
    onSuccess: handleSuccess,
    onError: handleError,
  });

  const dislike = trpc.videoReaction.dislike.useMutation({
    onSuccess: handleSuccess,
    onError: handleError,
  });

  return { like, dislike };
};

const ReactionButton = ({
  onClick,
  disabled,
  icon: Icon,
  count,
  isActive,
  className,
}: {
  onClick: () => void;
  disabled: boolean;
  icon: typeof ThumbsUpIcon;
  count: number;
  isActive: boolean;
  className: string;
}) => (
  <Button
    onClick={onClick}
    disabled={disabled}
    className={className}
    variant={"secondary"}
  >
    <Icon className={cn("size-5", isActive && "fill-black")} />
    {count}
  </Button>
);

export const VideoReactions = ({
  videoId,
  likes,
  dislikes,
  viewerReaction,
}: VideoReactionsProps) => {
  const { like, dislike } = useVideoReaction(videoId);
  const isLoading = like.isPending || dislike.isPending;

  return (
    <div className="flex items-center flex-none">
      <ReactionButton
        onClick={() => like.mutate({ videoId })}
        disabled={isLoading}
        icon={ThumbsUpIcon}
        count={likes}
        isActive={viewerReaction === "like"}
        className="rounded-l-full rounded-r-none gap-2 pr-4"
      />
      <Separator orientation="vertical" className="h-7" />
      <ReactionButton
        onClick={() => dislike.mutate({ videoId })}
        disabled={isLoading}
        icon={ThumbsDownIcon}
        count={dislikes}
        isActive={viewerReaction === "dislike"}
        className="rounded-none rounded-r-full pl-4"
      />
    </div>
  );
};
