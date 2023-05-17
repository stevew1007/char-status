import { clerkClient } from "@clerk/nextjs";
import type { User } from "@clerk/nextjs/dist/server";
import type { Post } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  createTRPCRouter,
  privateProcedure,
  publicProcedure,
} from "~/server/api/trpc";

import { Ratelimit } from "@upstash/ratelimit"; // for deno: see above
import { Redis } from "@upstash/redis";

// Create a new ratelimiter, that allows 3 requests per 1 min
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, "1 m"),
  analytics: true,
  /**
   * Optional prefix for the keys used in redis. This is useful if you want to share a redis
   * instance with other applications and want to avoid key collisions. The default prefix is
   * "@upstash/ratelimit"
   */
  prefix: "@upstash/ratelimit",
});

const filterUserForClient = (user: User) => {
  // console.log("user::: ", user);
  return {
    id: user.id,
    username: user.username,
    emailAddresses: user.emailAddresses[0],
    profileImageUrl: user.profileImageUrl,
  };
};

export const postsRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const posts = ctx.prisma.post.findMany({
      take: 100,
      orderBy: [{ createdAt: "desc" }],
      // where: {authorId: ctx.user?.id},
    });
    const users = (
      await clerkClient.users.getUserList({
        userId: (await posts).map((post) => post.authorId),
        limit: 100,
      })
    ).map(filterUserForClient);

    return (await posts).map((post: Post) => {
      const author = users.find((user) => user.id === post.authorId);
      if (!author)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Author for post not found",
        });
      return {
        post,
        author: users.find((user) => user.id === post.authorId),
      };
    });
  }),
  create: privateProcedure
    .input(z.object({ content: z.string().min(3).max(280) }))
    .mutation(async ({ ctx, input }) => {
      const authorId = ctx.userId;
      const { success } = await ratelimit.limit(authorId);

      if (!success)
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
        });
      const post = await ctx.prisma.post.create({
        data: {
          authorId,
          content: input.content,
        },
      });
      return post;
    }),
});
