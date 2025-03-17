import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const subscriptionsRouter = createTRPCRouter({
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
