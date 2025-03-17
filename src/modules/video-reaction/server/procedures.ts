import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { db } from "@/db";
import { videoReactions } from "@/db/schema";
import { and, eq } from "drizzle-orm";

// 创建视频点赞相关的路由器
export const videoReactionsRouter = createTRPCRouter({
  // 处理视频点赞的mutation
  like: protectedProcedure
    .input(
      // 验证输入参数：需要一个合法的视频ID
      z.object({
        videoId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 从上下文中获取当前用户ID
      const { id: userId } = ctx.user;
      const { videoId } = input;

      // 查询是否存在该用户对该视频的点赞记录
      const [existingVideoReactionLike] = await db
        .select()
        .from(videoReactions)
        .where(
          and(
            eq(videoReactions.userId, userId),
            eq(videoReactions.videoId, videoId),
            eq(videoReactions.type, "like")
          )
        );

      // 如果已经点赞，则删除点赞记录（取消点赞）
      if (existingVideoReactionLike) {
        const [deletedViewerReaction] = await db
          .delete(videoReactions)
          .where(
            and(
              eq(videoReactions.userId, userId),
              eq(videoReactions.videoId, videoId)
            )
          )
          .returning();
        return deletedViewerReaction;
      }

      // 如果未点赞，则创建新的点赞记录
      // 使用onConflictDoUpdate处理并发情况，确保同一用户对同一视频只有一个反应
      const [createVideoReaction] = await db
        .insert(videoReactions)
        .values({
          userId,
          videoId,
          type: "like",
        })
        .onConflictDoUpdate({
          target: [videoReactions.userId, videoReactions.videoId],
          set: {
            type: "like",
          },
        })
        .returning();

      return createVideoReaction;
    }),

  // 处理视频不喜欢的mutation
  dislike: protectedProcedure
    .input(
      // 验证输入参数：需要一个合法的视频ID
      z.object({
        videoId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 从上下文中获取当前用户ID
      const { id: userId } = ctx.user;
      const { videoId } = input;

      // 查询是否存在该用户对该视频的不喜欢记录
      const [existingVideoReactionDislike] = await db
        .select()
        .from(videoReactions)
        .where(
          and(
            eq(videoReactions.userId, userId),
            eq(videoReactions.videoId, videoId),
            eq(videoReactions.type, "dislike")
          )
        );

      // 如果已经不喜欢，则删除记录（取消不喜欢）
      if (existingVideoReactionDislike) {
        const [deletedViewerReaction] = await db
          .delete(videoReactions)
          .where(
            and(
              eq(videoReactions.userId, userId),
              eq(videoReactions.videoId, videoId)
            )
          )
          .returning();
        return deletedViewerReaction;
      }

      // 如果未表达不喜欢，则创建新的不喜欢记录
      // 使用onConflictDoUpdate处理并发情况，确保同一用户对同一视频只有一个反应
      const [createVideoReaction] = await db
        .insert(videoReactions)
        .values({
          userId,
          videoId,
          type: "dislike",
        })
        .onConflictDoUpdate({
          target: [videoReactions.userId, videoReactions.videoId],
          set: {
            type: "dislike",
          },
        })
        .returning();

      return createVideoReaction;
    }),
});
