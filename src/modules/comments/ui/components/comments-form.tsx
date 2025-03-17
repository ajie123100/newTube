import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/user-avatar";
import { THUMBNAIL_FALLBACK } from "@/modules/videos/constants";
import { useClerk, useUser } from "@clerk/nextjs";
import { useForm } from "react-hook-form";
import { commentInsertSchema } from "@/db/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { trpc } from "@/trpc/client";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";

interface CommentsFormProps {
  videoId: string;
  onSuccess?: () => void;
}

export const CommentsForm = ({ videoId, onSuccess }: CommentsFormProps) => {
  const clerk = useClerk();
  const { user } = useUser();
  const utils = trpc.useUtils();
  const create = trpc.comments.create.useMutation();
  const form = useForm<z.infer<typeof commentInsertSchema>>({
    resolver: zodResolver(commentInsertSchema.omit({ userId: true })),
    defaultValues: {
      videoId: videoId,
      value: "",
    },
  });
  const handleSubmit = (value: z.infer<typeof commentInsertSchema>) => {
    create.mutate(value, {
      onSuccess: () => {
        utils.comments.getMany.invalidate({ videoId });
        form.reset();
        toast.success("Comment added");
        onSuccess?.();
      },
      onError: (err) => {
        toast.error("Something went wrong");
        if (err.data?.code === "UNAUTHORIZED") {
          clerk.openSignIn();
        }
      },
    });
  };
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex gap-4 group"
      >
        <UserAvatar
          size={"lg"}
          imageUrl={user?.imageUrl || "/user-placeholder.svg"}
          name={user?.username || "User"}
        />
        <div className="flex-1">
          <FormField
            name="value"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Add a comment..."
                    className="resize-none bg-transparent overflow-hidden min-h-0 w-full h-[64px]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="justify-end gap-2 mt-2 flex">
            <Button disabled={create.isPending} type="submit" size={"sm"}>
              Comment
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
};
