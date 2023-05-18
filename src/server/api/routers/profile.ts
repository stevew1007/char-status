import { clerkClient } from "@clerk/nextjs";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { filterUserForClient } from "~/server/helpers/filterUserForClient";

export const profileRouter = createTRPCRouter({
  getUserByEmail: publicProcedure
    .input(z.object({ emailAddress: z.string().email() }))
    .query(async ({ input }) => {
      const users = await clerkClient.users.getUserList({
        emailAddress: [input.emailAddress],
      });
      // console.log("users::: ", users);
      const user = users[0];
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }
      return filterUserForClient(user);
    }),
});
