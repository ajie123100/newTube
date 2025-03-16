import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ThumbsDownIcon, ThumbsUpIcon } from "lucide-react";

export const VideoReactions = () => {
  const videoReaction: "like" | "dislike" = "like";
  return (
    <div className="flex items-center flex-none">
      <Button
        className="rounded-l-full rounded-r-nune gap-2 pr-4"
        variant={"secondary"}
      >
        <ThumbsUpIcon
          className={cn("size-5", videoReaction === "like" && "fill-black")}
        />
        {1}
      </Button>
      <Separator orientation="vertical" className="h-7" />
      <Button
        className="rounded-none rounded-r-full  pl-4"
        variant={"secondary"}
      >
        <ThumbsDownIcon
          className={cn("size-5", videoReaction !== "like" && "fill-black")}
        />
        {1}
      </Button>
    </div>
  );
};
