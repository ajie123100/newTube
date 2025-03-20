import { trpc } from "@/trpc/client";
import { useClerk } from "@clerk/nextjs";
import { toast } from "sonner";

interface UseSubscriptionProps {
  userId: string;
  isSubscribed: boolean;
  fromVideoId?: string;
}

export const useSubscription = ({
  userId,
  isSubscribed,
  fromVideoId,
}: UseSubscriptionProps) => {
  const clerk = useClerk();
  const utils = trpc.useUtils();

  const handleSuccess = (action: "Subscribed" | "Unsubscribed") => {
    toast.success(`${action}!`);
    utils.videos.getManySubscribed.invalidate();
    utils.videos.getOne.invalidate({ id: userId });
    if (fromVideoId) {
      utils.videos.getOne.invalidate({ id: fromVideoId });
    }
  };

  const subscribe = trpc.subscriptions.create.useMutation({
    onSuccess: () => handleSuccess("Subscribed"),
    onError: (error) => {
      toast.error("Something went wrong!");
      if (error.data?.code === "UNAUTHORIZED") {
        clerk.openSignIn();
      }
    },
  });

  const unsubscribe = trpc.subscriptions.remove.useMutation({
    onSuccess: () => handleSuccess("Unsubscribed"),
    onError: (error) => {
      toast.error("Something went wrong!");
      if (error.data?.code === "UNAUTHORIZED") {
        clerk.openSignIn();
      }
    },
  });

  const isPending = subscribe.isPending || unsubscribe.isPending;

  const onClick = () => {
    if (!clerk.user?.id) {
      return clerk.openSignIn();
    }
    if (isSubscribed) {
      return unsubscribe.mutateAsync({
        userId,
      });
    } else {
      return subscribe.mutateAsync({
        userId,
      });
    }
  };
  return {
    onClick,
    isPending,
  };
};
