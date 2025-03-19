import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { db } from "@/db";
import { subscriptions, users } from "@/db/schema";
import { and, desc, eq, getTableColumns, lt, or } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const subscriptionsRouter = createTRPCRouter({
  getMany: protectedProcedure
    .input(
      z.object({
        cursor: z
          .object({
            creatorId: z.string().uuid(),
            updatedAt: z.date(),
          })
          .nullish(),
        limit: z.number().min(1).max(100),
      })
    )
    .query(async ({ input, ctx }) => {
      const { id: userId } = ctx.user;
      const { cursor, limit } = input;

      const data = await db
        .select({
          ...getTableColumns(subscriptions),
          users: {
            ...getTableColumns(users),
            subscriptionCount: db.$count(
              subscriptions,
              eq(subscriptions.creatorId, users.id)
            ),
          },
        })
        .from(subscriptions)
        .innerJoin(users, eq(subscriptions.creatorId, users.id))
        .where(
          and(
            eq(subscriptions.viewerId, userId),
            cursor
              ? or(
                  lt(subscriptions.updatedAt, cursor.updatedAt),

                  and(
                    eq(subscriptions.updatedAt, cursor.updatedAt),
                    lt(subscriptions.creatorId, cursor.creatorId)
                  )
                )
              : undefined
          )
        )
        .orderBy(desc(subscriptions.updatedAt), desc(subscriptions.creatorId))
        //1 more to check if there is more data
        .limit(limit + 1);

      const hasMore = data.length > limit;
      const items = hasMore ? data.slice(0, -1) : data;

      const lastItem = items[items.length - 1];
      const nextCursor = hasMore
        ? {
            creatorId: lastItem.creatorId,
            updatedAt: lastItem.updatedAt,
          }
        : null;
      return { items, nextCursor };
    }),
  create: protectedProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id: viewerId } = ctx.user;
      const { userId: creatorId } = input;

      // 防止自我订阅
      if (creatorId === viewerId) {
        throw new TRPCError({ code: "BAD_REQUEST" });
      }

      // 查询是否已经订阅
      const [existingSubscription] = await db
        .select()
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.viewerId, viewerId),
            eq(subscriptions.creatorId, creatorId)
          )
        );

      // 如果已经订阅，则取消订阅
      if (existingSubscription) {
        const [deletedSubscription] = await db
          .delete(subscriptions)
          .where(
            and(
              eq(subscriptions.viewerId, viewerId),
              eq(subscriptions.creatorId, creatorId)
            )
          )
          .returning();
        return deletedSubscription;
      }

      // 如果未订阅，则创建新的订阅
      const [createdSubscription] = await db
        .insert(subscriptions)
        .values({
          viewerId,
          creatorId,
        })
        .returning();

      return createdSubscription;
    }),
  remove: protectedProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id: viewerId } = ctx.user;
      const { userId: creatorId } = input;

      // 删除订阅关系
      const [deletedSubscription] = await db
        .delete(subscriptions)
        .where(
          and(
            eq(subscriptions.viewerId, viewerId),
            eq(subscriptions.creatorId, creatorId)
          )
        )
        .returning();

      if (!deletedSubscription) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return deletedSubscription;
    }),
});
