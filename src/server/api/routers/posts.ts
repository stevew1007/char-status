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
      // if (!author.username) {
      //   // user the ExternalUsername
      //   throw new TRPCError({
      //     code: "INTERNAL_SERVER_ERROR",
      //     message: `Author has no GitHub Account: ${author.id}`,
      //   });
      // }
      return {
        post,
        author: users.find((user) => user.id === post.authorId),
      };
    });
  }),
  create: privateProcedure
    .input(z.object({ content: z.string().min(1).max(280) }))
    .mutation(async ({ ctx, input }) => {
      const authorId = ctx.userId;
      const post = await ctx.prisma.post.create({
        data: {
          authorId,
          content: input.content,
        },
      });
      return post;
    }),
});
