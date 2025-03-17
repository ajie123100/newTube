import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/trpc/init'
import { db } from '@/db'
import { commentReactions } from '@/db/schema'
import { and, eq } from 'drizzle-orm'

// 创建评论点赞相关的路由器
export const commentReactionsRouter = createTRPCRouter({
  // 处理评论点赞的mutation
  like: protectedProcedure
    .input(
      // 验证输入参数：需要一个合法的视频ID
      z.object({
        commentId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // 从上下文中获取当前用户ID
      const { id: userId } = ctx.user
      const { commentId } = input

      // 查询是否存在该用户对该评论的点赞记录
      const [existingCommentReactionLike] = await db
        .select()
        .from(commentReactions)
        .where(
          and(
            eq(commentReactions.commentId, commentId),
            eq(commentReactions.userId, userId),
            eq(commentReactions.type, 'like'),
          ),
        )

      // 如果已经点赞，则删除点赞记录（取消点赞）
      if (existingCommentReactionLike) {
        const [deletedViewerReaction] = await db
          .delete(commentReactions)
          .where(
            and(
              eq(commentReactions.userId, userId),
              eq(commentReactions.commentId, commentId),
            ),
          )
          .returning()
        return deletedViewerReaction
      }

      // 如果未点赞，则创建新的点赞记录
      // 使用onConflictDoUpdate处理并发情况，确保同一用户对同一评论只有一个反应
      const [createCommentReaction] = await db
        .insert(commentReactions)
        .values({
          userId,
          commentId,
          type: 'like',
        })
        .onConflictDoUpdate({
          target: [commentReactions.userId, commentReactions.commentId],
          set: {
            type: 'like',
          },
        })
        .returning()

      return createCommentReaction
    }),

  // 处理评论不喜欢的mutation
  dislike: protectedProcedure
    .input(
      // 验证输入参数：需要一个合法的视频ID
      z.object({
        commentId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // 从上下文中获取当前用户ID
      const { id: userId } = ctx.user
      const { commentId } = input

      // 查询是否存在该用户对该视频的不喜欢记录
      const [existingCommentReactionDislike] = await db
        .select()
        .from(commentReactions)
        .where(
          and(
            eq(commentReactions.userId, userId),
            eq(commentReactions.commentId, commentId),
            eq(commentReactions.type, 'dislike'),
          ),
        )

      // 如果已经不喜欢，则删除记录（取消不喜欢）
      if (existingCommentReactionDislike) {
        const [deletedViewerReaction] = await db
          .delete(commentReactions)
          .where(
            and(
              eq(commentReactions.userId, userId),
              eq(commentReactions.commentId, commentId),
            ),
          )
          .returning()
        return deletedViewerReaction
      }

      // 如果未表达不喜欢，则创建新的不喜欢记录
      // 使用onConflictDoUpdate处理并发情况，确保同一用户对同一评论只有一个反应
      const [createCommentReaction] = await db
        .insert(commentReactions)
        .values({
          userId,
          commentId,
          type: 'dislike',
        })
        .onConflictDoUpdate({
          target: [commentReactions.userId, commentReactions.commentId],
          set: {
            type: 'dislike',
          },
        })
        .returning()

      return createCommentReaction
    }),
})
