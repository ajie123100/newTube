import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/user-avatar";
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

interface CommentFormProps {
  videoId: string;
  parentId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  variant?: "reply" | "comment";
}

export const CommentForm = ({
  videoId,
  onSuccess,
  parentId,
  variant = "comment",
  onCancel,
}: CommentFormProps) => {
  const clerk = useClerk();
  const { user } = useUser();
  const utils = trpc.useUtils();
  const create = trpc.comments.create.useMutation();
  const form = useForm<z.infer<typeof commentInsertSchema>>({
    resolver: zodResolver(commentInsertSchema.omit({ userId: true })),
    defaultValues: {
      parentId: parentId,
      videoId: videoId,
      value: "",
    },
  });
  const handleSubmit = (value: z.infer<typeof commentInsertSchema>) => {
    create.mutate(value, {
      onSuccess: () => {
        utils.comments.getMany.invalidate({ videoId });
        utils.comments.getMany.invalidate({ videoId, parentId });
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
  const handleCancel = () => {
    form.reset();
    onCancel?.();
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
                    placeholder={
                      variant === "reply" ? "Reply to comment" : "Add a comment"
                    }
                    className="resize-none bg-transparent overflow-hidden min-h-0 w-full h-[64px]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="justify-end gap-2 mt-2 flex">
            {variant === "reply" && (
              <Button
                type="button"
                size={"sm"}
                variant={"ghost"}
                onClick={handleCancel}
              >
                Cancel
              </Button>
            )}
            <Button disabled={create.isPending} type="submit" size={"sm"}>
              {variant === "reply" ? "Reply" : "Comment"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
};
