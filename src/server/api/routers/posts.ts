import { clerkClient } from "@clerk/nextjs";
import type { User } from "@clerk/nextjs/dist/server";
import type { Post } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

const filterUserForClient = (user: User) => {
  return {
    id: user.id,
    username: user.username,
    profileImageUrl: user.profileImageUrl,
  };
};

export const postsRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const posts = ctx.prisma.post.findMany({
      take: 100,
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
});
