import type { User } from "@clerk/nextjs/dist/server";

export const filterUserForClient = (user: User) => {
  //   console.log("user::: ", user);
  return {
    id: user.id,
    username: user.username,
    emailAddress: user.emailAddresses[0]?.emailAddress,
    profileImageUrl: user.profileImageUrl,
  };
};
