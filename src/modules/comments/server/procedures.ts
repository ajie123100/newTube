import { z } from "zod"; // 导入zod库用于输入验证
import {
  baseProcedure, // 基础过程，不需要身份验证
  createTRPCRouter, // 创建TRPC路由器的函数
  protectedProcedure, // 受保护过程，需要身份验证
} from "@/trpc/init";
import { db } from "@/db"; // 导入数据库连接
import { commentReactions, comments, users } from "@/db/schema"; // 导入评论和用户表模型
import {
  desc,
  eq,
  getTableColumns,
  and,
  or,
  lt,
  count,
  inArray,
  isNotNull,
  isNull,
} from "drizzle-orm"; // 导入drizzle-orm操作符和工具函数
import { TRPCError } from "@trpc/server";

// 创建评论路由器，包含创建评论和获取评论列表的功能
export const commentsRouter = createTRPCRouter({
  remove: protectedProcedure
    .input(
      // 定义输入验证规则
      z.object({
        id: z.string().uuid(), // 视频ID必须是有效的UUID
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 从输入中解构出视频ID和评论内容
      const { id } = input;
      // 从上下文中获取当前登录用户的ID
      const { id: userId } = ctx.user;

      const [deletedComment] = await db
        .delete(comments)
        .where(and(eq(comments.userId, userId), eq(comments.id, id)))
        .returning();

      if (!deletedComment) {
        return new TRPCError({ code: "NOT_FOUND" });
      }

      return deletedComment;
    }),
  // 创建评论的过程，需要用户登录
  create: protectedProcedure
    .input(
      // 定义输入验证规则
      z.object({
        parentId: z.string().uuid().nullish(), // 父评论ID可以为空，用于回复其他评论
        videoId: z.string().uuid(), // 视频ID必须是有效的UUID
        value: z
          .string()
          .min(1, "评论内容不能为空") // 评论内容至少1个字符
          .max(1000, "评论内容不能超过1000个字符"), // 评论内容最多1000个字符
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 从输入中解构出视频ID和评论内容
      const { parentId, videoId, value } = input;
      // 从上下文中获取当前登录用户的ID
      const { id: userId } = ctx.user;

      const [existingComment] = await db
        .select()
        .from(comments)
        .where(inArray(comments.id, parentId ? [parentId] : []));

      if (!existingComment && parentId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // 检查是否存在父评论
      if (parentId && existingComment?.parentId) {
        throw new TRPCError({ code: "BAD_REQUEST" });
      }

      // 向数据库插入新评论并返回插入的评论记录
      const [comment] = await db
        .insert(comments)
        .values({
          userId, // 评论者ID
          videoId, // 被评论的视频ID
          value, // 评论内容
          parentId, // 父评论ID，用于回复其他评论
        })
        .returning(); // 返回插入的记录

      return comment; // 返回新创建的评论
    }),
  // 获取评论列表的过程，不需要用户登录
  getMany: baseProcedure
    .input(
      // 定义输入验证规则
      z.object({
        videoId: z.string().uuid(), // 视频ID必须是有效的UUID
        parentId: z.string().uuid().nullish(), // 父评论ID可以为空，用于获取回复评论
        cursor: z
          .object({
            id: z.string().uuid(), // 游标ID必须是有效的UUID
            updatedAt: z.date(), // 游标更新时间必须是有效的日期
          })
          .nullish(), // 游标可以为空，用于首次加载
        limit: z.number().min(1).max(100), // 限制返回的评论数量，最少1条，最多100条
      })
    )
    .query(async ({ ctx, input }) => {
      const { clerkUserId } = ctx;
      // 从输入中解构出视频ID、游标和限制数量
      const { videoId, cursor, limit, parentId } = input;

      let userId;

      const [user] = await db
        .select()
        .from(users)
        .where(clerkUserId ? eq(users.clerkId, clerkUserId) : undefined);
      // .where(inArray(users.clerkId, clerkUserId ? [clerkUserId] : []))

      if (user) {
        userId = user.id;
      }

      const viewerReactions = db.$with("viewer_reactions").as(
        db
          .select({
            commentId: commentReactions.commentId,
            type: commentReactions.type,
          })
          .from(commentReactions)
          .where(inArray(commentReactions.userId, userId ? [userId] : []))
      );

      const replies = db.$with("replies").as(
        db
          .select({
            parentId: comments.parentId,
            count: count(comments.id).as("count"),
          })
          .from(comments)
          .where(isNotNull(comments.parentId)) // 筛选非空的父评论ID
          .groupBy(comments.parentId)
      );

      // 查询数据库获取评论列表
      const data = await db
        .with(viewerReactions, replies)
        .select({
          ...getTableColumns(comments), // 选择评论表的所有列
          user: users, // 同时选择关联的用户信息
          viewerReaction: viewerReactions.type,
          replyCount: replies.count,
          likeCount: db.$count(
            commentReactions,
            and(
              eq(commentReactions.commentId, comments.id),
              eq(commentReactions.type, "like")
            )
          ),
          dislikeCount: db.$count(
            commentReactions,
            and(
              eq(commentReactions.commentId, comments.id),
              eq(commentReactions.type, "dislike")
            )
          ),
        })
        .from(comments)
        .where(
          and(
            eq(comments.videoId, videoId), // 筛选指定视频的评论
            parentId
              ? eq(comments.parentId, parentId) // 筛选指定父评论的回复
              : isNull(comments.parentId), // 筛选顶级评论
            cursor
              ? or(
                  // 如果有游标，则获取比游标更早的评论
                  lt(comments.updatedAt, cursor.updatedAt), // 更新时间早于游标
                  and(
                    eq(comments.updatedAt, cursor.updatedAt), // 更新时间等于游标
                    lt(comments.id, cursor.id) // 但ID小于游标ID
                  )
                )
              : undefined // 如果没有游标，则不添加额外条件
          )
        )
        .innerJoin(users, eq(comments.userId, users.id)) // 关联用户表
        .leftJoin(viewerReactions, eq(viewerReactions.commentId, comments.id))
        .leftJoin(replies, eq(comments.id, replies.parentId))
        .orderBy(desc(comments.updatedAt), desc(comments.id)) // 按更新时间和ID降序排序
        .limit(limit + 1); // 多查询一条用于判断是否有更多数据

      // 获取评论总数
      const [{ totalCount }] = await db
        .select({
          totalCount: count(),
        })
        .from(comments)
        .where(
          and(
            eq(comments.videoId, videoId), // 筛选指定视频的评论
            isNull(comments.parentId) // 筛选顶级评论
          )
        );

      // 判断是否有更多数据
      const hasMore = data.length > limit;
      // 如果有更多数据，则去掉多查询的一条
      const items = hasMore ? data.slice(0, -1) : data;
      // 获取最后一条评论，用于构建下一页游标
      const lastItem = items[items.length - 1];
      // 构建下一页游标
      const nextCursor = hasMore
        ? {
            id: lastItem.id, // 最后一条评论的ID
            updatedAt: lastItem.updatedAt, // 最后一条评论的更新时间
          }
        : null; // 如果没有更多数据，则游标为null

      // 返回评论列表和下一页游标
      return { items, nextCursor, totalCount };
    }),
});
